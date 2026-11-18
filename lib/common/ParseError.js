class ParseError extends Error {
  constructor(message, code) {
    super(message);
    this.name = 'ParseError';

    if (code) {
      this.code = code;
    }
  }
}

module.exports = {
  ParseError
};
