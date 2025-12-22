# Tree-sitter Grammar for Mail

## Point Of This Fork

I created this fork mainly to add `.eml` support to Helix. However, the original
grammar is a bit lacking so I've also decided to expand it a bit, to support
things like unique highlighting for quoted replies in the body text.

Although at the time of forking, the grammar was using ABI 14, tree-sitter's
default is 15. So, I decided it would be better for me to maintain an ABI 14
version of the grammar which we can be confident won't be upgraded.

## Improvements Over Original

- Added support for carriage return (`\r\n`) newlines.
  - The previous parser broke if line endings weren't UNIX style.
  - Carriage returns are very common in email files.
  - They're also used by External Editor Revived.
- Added rules for quoted blocks.
  - Quoted blocks are used in reply emails.
  - Users may want to highlight these differently.
  - This also opens the door to text object queries for easily operating on
    quote blocks.
- Added distinction between email address delimiter and address.
- Improved error detection on malformed headers.
- Added highlight queries (for Helix).
- Added text object queries (for Helix).
  - Names, addresses, and other fields in headers are `entry`.
  - Subject and body paragraphs are `function`.
  - Quoted replies are `comment`.
- Added support for email-only headers (no Name)
  - Also fixed capitalized email addresses.
  - Thanks to [die1465](https://github.com/die1465) for helping with the regex.

### Workarounds

For some reason, Helix was refusing to treat the last node in the file as a
valid text object unless it was followed by a newline. This is why `quote_group`
exists. I know it's redundant, but I couldn't get this working in Helix
otherwise.

### Neovim

To use in Neovim, the following needs to be added to e.g.
`$rumtime/after/ftplugin/mail.lua`:

```lua
vim.api.nvim_create_autocmd("User", {
  pattern = "TSUpdate",
  callback = function()
    require("nvim-treesitter.parsers").mail = {
      install_info = {
        url = "https://codeberg.org/ficd/tree-sitter-mail",
        branch = "master",
        queries = "queries/mail",
      },
    }
  end,
})
```

# Contributions

More than welcome. Please contribute. I am going clinically insane.
