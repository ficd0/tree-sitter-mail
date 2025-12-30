/**
 * @file Email parser
 * @author Steven Xu <stevenxxiu@gmail.com>
 * @author Daniel Fichtinger <daniel@ficd.ca>
 * @license MIT
 */

/// <reference types="tree-sitter-cli/dsl" />
// @ts-check

const SPECIAL = /[()<>@,;:\\".\[\]]/
// Control: ascii control characters or DEL
const CTL = /[\x00-\x1f\x7f]/ 
const NEWLINE = /\r?\n/
// Signature separator
const SIGSEP = /-- \r?\n/
// content of an unstructured header, possibly spanning multiple lines
// where each extra line starts with space or tab
const MULTILINE_HEADER = /(?:.*|.+(?:\r?\n[ \t]+.+)*)/
// email adress
const EMAIL = /(?:[a-zA-Z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-zA-Z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?\.)+[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?|\[(?:(?:(2(5[0-5]|[0-4][0-9])|1[0-9][0-9]|[1-9]?[0-9]))\.){3}(?:(2(5[0-5]|[0-4][0-9])|1[0-9][0-9]|[1-9]?[0-9])|[a-zA-Z0-9-]*[a-zA-Z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])/

export default grammar({
  name: 'mail',
  extras: (_$) => [' '],

  rules: {
    source_file: ($) => seq($._headers, optional(seq($.body_separator, $.body))),

    _headers: ($) => repeat1(seq($._header, NEWLINE)),

    _header: ($) => choice(prec(1, $.header_email), prec(1, $.header_subject), $.header_other),
    header_email: ($) =>
      seq($.header_field_email,
        $.header_separator,
        choice(
          seq(token(' '), choice(seq($.atom_block, $.email), $.email, $.atom_block, $.email_address)),
          optional(token(' ')),
        )),
    header_other: ($) => seq($.header_field, $.header_separator, choice(optional(token(' ')), seq(token(' '), $.header_unstructured))),
    header_subject: ($) => seq($.header_field_subject, $.header_separator, token(' '), $.subject),

    header_separator: (_$) => ':',
    header_field: (_$) => new RegExp(`[^${CTL.source.slice(1, -1)}\\s:]+`),
    header_field_email: (_$) => choice('From', 'To', 'Cc', 'Bcc', 'Reply-To'),
    header_field_subject: (_$) => 'Subject',
    header_unstructured: (_$) => MULTILINE_HEADER,
    subject: (_$) => MULTILINE_HEADER,
    atom_block: ($) => repeat1(choice($.atom, $.quoted_string)),
    atom: (_$) => new RegExp(`[^${SPECIAL.source.slice(1, -1)}\\s${CTL.source.slice(1, -1)}]+`),
    quoted_string: (_$) => /"[^"\\\n]+"/,
    email_delimiter: (_$) => choice(token('>'), token('<')),
    email_address: (_$) => EMAIL,
    email: ($) => seq(
      $.email_delimiter,
      $.email_address,
      $.email_delimiter,
    ),

    body_signature_separator: (_$) => SIGSEP,
    body_signature: ($) => repeat1(choice(
      $._empty_line,
      $._body_line)),

    body_separator: (_$) => NEWLINE,
    body: ($) => seq(
      repeat1(choice(
        prec(3, $._empty_line),
        prec(2, $.quote_group),
        prec(1, $.body_block),
      )
      ),
      optional(seq($.body_signature_separator, $.body_signature))
    ),

    quote_group: ($) => prec.right(repeat1($._quoted_line)),
    quoted_block: ($) => seq(
      $.quote_marker,
      $.quote_contents
    ),
    _quoted_line: ($) =>
      seq(
        $.quoted_block,
        NEWLINE,
      ),
    quote_marker: (_$) => token('>'),
    quote_contents: (_$) => token(/[^\r\n]*/),
    body_block: ($) => prec.right(repeat1($._body_line)),
    _body_line: (_$) => seq(/[^\r\n>].*/, NEWLINE),
    _empty_line: (_$) => NEWLINE,

  },
})
