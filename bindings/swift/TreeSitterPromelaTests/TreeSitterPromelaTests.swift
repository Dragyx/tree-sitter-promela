import XCTest
import SwiftTreeSitter
import TreeSitterPromela

final class TreeSitterPromelaTests: XCTestCase {
    func testCanLoadGrammar() throws {
        let parser = Parser()
        let language = Language(language: tree_sitter_promela())
        XCTAssertNoThrow(try parser.setLanguage(language),
                         "Error loading Promela - Process Meta Language grammar")
    }
}
