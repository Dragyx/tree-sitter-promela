package tree_sitter_promela_test

import (
	"testing"

	tree_sitter "github.com/tree-sitter/go-tree-sitter"
	tree_sitter_promela "github.com/dragyx/tree-sitter-promela/bindings/go"
)

func TestCanLoadGrammar(t *testing.T) {
	language := tree_sitter.NewLanguage(tree_sitter_promela.Language())
	if language == nil {
		t.Errorf("Error loading Promela - Process Meta Language grammar")
	}
}
