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
    spec: $ => seq($.module, repeat(seq(optional(';'), $.module))),
    module: $ => choice(
      $.proctype,
      $.init,
      $.never,
      $.trace,
      $.utype,
      $.mtype,
      $.decl_lst
    ), 
    proctype: $ => seq(
      optional('active'),
      'proctype',
        $.identifier,
      '(',
        optional($.decl_lst),
      ')',
      optional($.priority),
      optional(seq('provided', '(', $.expr, ')')),
      '{',
        $.sequence,
      '}'
    ),
    init: $ => seq(
      'init',
      optional($.priority),
      '{',
      $.sequence,
      '}'
    ),
    never: $ => seq('never', '{', $.sequence, '}'),
    trace: $ => seq('trace', '{', $.sequence, '}'),
    utype: $ => seq('typedef', $.identifier, '{', $.decl_lst, '}'),
    mtype: $ => seq('mtype', optional('='), '{',
        optional($.identifier),
        repeat(seq(',', $.identifier)),
        '}'
    ),
    decl_lst: $ => prec.left(seq($.decl, repeat(seq($.sep, $.decl)))),
    decl: $ => prec(3, choice(
      seq(optional($.visible),
        $.identifier,
        $.identifier,
        optional(seq('[', $.const, ']')),
        optional(seq('=', choice($.any_expr, $.ch_init))),
        repeat(seq(',',
          optional(seq('[', $.const, ']')),
          optional(seq('=', choice($.any_expr, $.ch_init))))
        )),
      seq(optional($.visible), 'unsigned', $.identifier, ':', $.const, optional(seq('=', $.any_expr)))
    )),
    priority: $ => seq('priority', $.const),
    visible: $ => choice('hidden', 'show'),
    sequence: $ => seq($.step, prec.right(repeat(seq($.sep, $.step))), optional($.sep)),
    step: $ => choice(
      seq($.stmnt, optional(seq('unless', $.stmnt))),
      $.decl_lst,
      seq(choice('xr', 'xs'), $.varref, repeat(seq(',', $.varref)))
    ), 
    ch_init: $ => seq(
      '[', $.const, ']', 'of', '{',
        $.identifier, repeat(seq(',', $.identifier)),
      '}'
    ),
    varref: $ => seq($.identifier, optional(seq('[', $.any_expr ,']')), optional(seq('.', $.varref))),
    send: $=> seq(
      $.varref, choice('!', '!!'), $.send_args
    ),
    receive: $ => seq(
      $.varref, choice(
      seq('?', '<',  $.send_args, '>'),
      seq('??', '<', $.send_args, '>'),
      seq('?',  $.send_args),
      seq('??', $.send_args),
      )
    ),
    poll: $ => seq($.varref, choice(
      seq('?', '[',  $.send_args, ']'),
      seq('??', '[', $.send_args, ']'),
    )),
    send_args: $ => choice($.arg_lst, seq($.any_expr, '(',$.arg_lst, ')')),
    arg_lst: $ => prec.right(seq($.any_expr, repeat(seq(',', $.any_expr)))),
    recv_args: $ => seq($.recv_arg, choice(repeat(seq(',', $.recv_arg)), seq('(', $.recv_args, ')'))),
    recv_arg: $ => choice(
      $.varref,
      seq('eval', '(', $.varref, ')'),
      seq(optional('-'), $.const)
    ),
    chanpoll: $ => choice('full', 'empty', 'nfull', 'nempty'),
    assign: $ => seq(
      $.varref,
      choice(
        seq('=', $.any_expr),
        '++',
        '--'
      )
    ),
    stmnt: $ => prec(2, choice(
      seq('if', repeat1(seq('::', $.sequence)), 'fi'),
      seq('do', repeat1(seq('::', $.sequence)), 'od'),
      seq('for', '(', $.range, ')', '{', $.sequence, '}'),
      seq('atomic', '{', $.sequence, '}'),
      seq('d_step', '{', $.sequence, '}'),
      seq('select', '(', $.range, ')'),
      seq('{', $.sequence, '}'),
      $.send,
      $.receive,
      $.assign,
      'else',
      'break',
      seq('goto', $.identifier),
      seq($.identifier, ':', $.stmnt),
      seq(choice('print', 'printf'), '(', $.string, optional(seq(',', $.arg_lst)), ')'),
      seq('assert', $.expr),
      $.expr,
      // TODO support embedded c code
      )
    ),
    range: $ => seq(
      $.identifier, choice(
        seq(':', $.any_expr, '..', $.any_expr),
        seq('in', $.identifier)
      )
    ),
    binop: $ => choice(
      '&&', '||', '+', '-', '*', '/', '%',
      '&', '^', '|', '>', '<', '>=', '<=', '==',
      '!=', '<<', '>>'
    ),
    unop: $ => choice('~', '-', '!'),
    any_expr: $ => prec(1, choice(
      seq('(', $.any_expr, ')'),
      prec.left(1, seq($.any_expr, $.binop, $.any_expr)),
      prec.right(2, seq($.unop, $.any_expr)),
      seq('(', $.any_expr,'->', $.any_expr, ':', $.any_expr, ')'),
      seq('len', '(', $.varref, ')'),
      $.send,
      $.receive,
      $.poll,
      $.const,
      $.identifier, // FIXME: NOT IN THE GRAMMAR
      'timeout',
      'np_',
      seq('enabled', '(', $.any_expr, ')'),
      seq('pc_value', '(', $.any_expr, ')'),
      seq($.identifier, '[', $.any_expr, ']', '@', $.identifier),
      seq('run', $.identifier, '(', optional($.arg_lst) ,')', optional($.priority)),
      seq('get_priority', '(', $.expr, ')'),
      seq('set_priority', '(', $.expr, $.expr, ')')
    )),
    expr: $ => choice(
      $.any_expr,
      seq('(', $.expr, ')'),
      prec.left(seq($.expr, choice('&&', '||'), $.expr)),
      seq($.chanpoll, '(', $.varref, ')')
    ),
    // _type: $ => '',
    string: $ => new RustRegex('"[ !#-~]*"'), // match any printable ascii char except '"', enclosed in '"'
    identifier: $ => new RustRegex('[a-zA-Z_][a-zA-Z0-9_]*'),
    const: $ => choice('true', 'false', 'skip', $.number),
    number: $ => new RustRegex('[0-9]+'),
    sep: $ => prec(10, choice(';', '->')), // FIXME: The documentation says that
                                // 'in most cases' ; can be replaced
                                // by ->
    // http://stackoverflow.com/questions/13014947/regex-to-match-a-c-style-multiline-comment/36328890#36328890
    comment: _ => token(choice(
      seq('//', /(\\+(.|\r?\n)|[^\\\n])*/),
      seq(
        '/*',
        /[^*]*\*+([^/*][^*]*\*+)*/,
        '/',
      ),
    )),
  },
  extras: $ => [' ', '\t', '\n', '\r', $.comment]
});
