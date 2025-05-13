{
  description = "A tree-sitter grammar for Promela";

  inputs = {
    nixpkgs.url = "github:NixOs/nixpkgs/nixos-unstable";
    systems.url = "github:nix-systems/default";
  };

  outputs = {
    self,
    nixpkgs,
    systems,
  }: let
    inherit (nixpkgs) lib;
    eachSystem = lib.genAttrs (import systems);
  in {
    packages = eachSystem (
      system: let
        pkgs = (import nixpkgs) {inherit system;};
        grammar-def = {
          language = "promela";
          version = "v0.0.0";
          src = ./.;
          generate = true; # generate the grammar.c automatically
        };
      in {
        default = self.packages.${system}.tree-sitter-promela;
        tree-sitter-promela = pkgs.tree-sitter.buildGrammar grammar-def;
      }
    );
    devShells = eachSystem (
      system: let
        pkgs = (import nixpkgs) {inherit system;};
      in {
        default = self.packages.${system}.tree-sitter-promela;
        tree-sitter-promela = pkgs.mkShell {
          nativeBuildInputs = with pkgs; [
            tree-sitter
            gcc
          ];
        };
      }
    );
  };
}
