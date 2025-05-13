/**
 * @file Promela is a language used by the Spin model checker
 * @author Dragyx
 * @license GPL
 */

/// <reference types="tree-sitter-cli/dsl" />
// @ts-check
// See https://spinroot.com/spin/Man/grammar.html

module.exports = grammar({
  name: "promela",

  rules: {
    // TODO: add the actual grammar rules
    source_file: $ => "hello"
  }
});
