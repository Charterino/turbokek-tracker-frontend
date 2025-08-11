{
  description = "node 22 dev flake for turbokek-tracker-frontend";

  inputs = {
    nixpkgs.url = "github:nixos/nixpkgs?ref=nixos-unstable";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs =
    {
      self,
      nixpkgs,
      flake-utils,
    }:
    flake-utils.lib.eachDefaultSystem (
      system:
      let
        pkgs = import nixpkgs {
          inherit system;
        };

        npmBuild = pkgs.buildNpmPackage {
          pname = "turbokek-tracker-frontend";
          version = "1.0.0";
          # Dont pass the .gitignore into src because it's going to be cleanSource'd anyway, and our .gitignore removes 'dist', which breaks everything
          src = pkgs.nix-gitignore.gitignoreSource [ ".gitignore" ] ./.;

          npmDepsHash = "sha256-36lAZ+SfNqvRWC6dgWnhTz65BkyFKWbPpfKNSazdHjM=";
        };

        finalDist = pkgs.runCommand "finalDist" { } ''
          mkdir -p $out/dist
          cp -r ${npmBuild}/lib/node_modules/turbokek-tracker-frontend/dist/* $out/dist
        '';

        dockerImage = pkgs.dockerTools.buildImage {
          name = "turbokek-tracker-frontend";
          tag = "latest";
          created = "now";
          copyToRoot = [
            finalDist
          ];
          config = {
            Cmd = [
              "${pkgs.caddy}/bin/caddy"
              "file-server"
              "--root"
              "/dist"
            ];
            ExposedPorts = {
              "80/tcp" = { };
            };
          };
        };
      in
      with pkgs;
      {
        devShells.default = mkShell {
          packages = [ nodejs_22 ];
        };
        packages = {
          inherit dockerImage;
        };
      }
    );
}
