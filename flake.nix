{
  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-23.11";
    utils.url = "github:numtide/flake-utils";
    flake-compat = {
      url = "github:edolstra/flake-compat";
      flake = false;
    };
  };

  outputs = { self, nixpkgs, utils, ... }:
    utils.lib.eachDefaultSystem (system:
      let
        pkgs = import nixpkgs { inherit system; };
      in
        {
          devShell = with pkgs; mkShell {
            buildInputs = [
	            pkgs.bashInteractive
              nodejs_20 nodePackages.npm nodePackages.typescript-language-server nodePackages.vscode-langservers-extracted nodePackages.eslint # node
              sqlite
            ];
          };
        });
}
