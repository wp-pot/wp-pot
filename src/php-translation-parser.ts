import {
  Engine,
  Comment,
  Call,
  Node,
  Name,
  Lookup,
  Reference,
} from "php-parser";

import { createTranslationId, Translation } from ".";

const parser = new Engine({
  parser: {
    extractDoc: true,
  },
  ast: {
    withPositions: true,
  },
  lexer: {
    short_tags: true,
  },
});

export type GetTextFunction = {
  name: string;
  contextPosition?: number;
  pluralPosition?: number;
};

export type PhpOptions = {
  extensions?: string[];
  metadataFile?: string;
  ignoreTemplateNameHeader?: boolean;
  gettextFunctions?: GetTextFunction[];
  commentKeyword?: string;
  textdomain?: string;
};

// @internal
export const defaultPhpOptions: PhpOptions = {
  extensions: ["php"],
  ignoreTemplateNameHeader: false,
  commentKeyword: "translators:",
  gettextFunctions: [
    { name: "__" },
    { name: "_e" },
    { name: "_ex", contextPosition: 2 },
    { name: "_n", pluralPosition: 2 },
    { name: "_n_noop", pluralPosition: 2 },
    { name: "_nx", pluralPosition: 2, contextPosition: 4 },
    { name: "_nx_noop", pluralPosition: 2, contextPosition: 3 },
    { name: "_x", contextPosition: 2 },
    { name: "esc_attr__" },
    { name: "esc_attr_e" },
    { name: "esc_attr_x", contextPosition: 2 },
    { name: "esc_html__" },
    { name: "esc_html_e" },
    { name: "esc_html_x", contextPosition: 2 },
  ],
};

// @internal
const metadataFileHeaders: string[] = [
  "Plugin Name",
  "Theme Name",
  "Description",
  "Author",
  "Author URI",
  "Plugin URI",
  "Theme URI",
];

// @internal
const propertiesContainingCalls = [
  "arguments",
  "alternate",
  "body",
  "catches",
  "children",
  "expr",
  "expression",
  "expressions",
  "trueExpr",
  "falseExpr",
  "items",
  "key",
  "left",
  "right",
  "value",
  "what",
];

// @internal
type FileComments = {
  [lineNumber: string]: string;
};

// @internal
export class PhpParser {
  protected options: PhpOptions;
  protected filename = "";
  protected fileComments: FileComments = {};

  public constructor(options: PhpOptions) {
    this.options = options;
  }

  public parseFile(fileContent: string, filename: string): Translation[] {
    const translations: Translation[] = [];
    this.filename = filename;
    this.fileComments = {};

    if (this.options.metadataFile === filename) {
      translations.push(
        ...this.parseFileHeader(metadataFileHeaders, fileContent, filename)
      );
    }

    if (!this.options.ignoreTemplateNameHeader) {
      translations.push(
        ...this.parseFileHeader(["Template Name"], fileContent, filename)
      );
    }

    const validFunctionsInFile: string[] =
      this.options.gettextFunctions?.reduce(
        (accumulator: string[], currentValue: GetTextFunction): string[] => {
          accumulator.push(currentValue.name.replace("$", "\\$"));
          return accumulator;
        },
        []
      ) || [];

    // Skip file if no translation functions is found
    if (new RegExp(validFunctionsInFile.join("|")).test(fileContent)) {
      const ast = parser.parseCode(fileContent, filename);

      this.fileComments = this.parseComments(ast.comments);

      translations.push(...this.parseCodeTree(ast));
    }

    return translations;
  }

  parseFileHeader = (
    headers: string[],
    fileContent: string,
    filename: string
  ): Translation[] => {
    const lines = fileContent.match(/[^\r\n]+/g);
    const translations: Translation[] = [];

    if (lines) {
      lines.splice(30);

      lines.forEach(function (lineContent, line) {
        headers.forEach(function (header) {
          const regex = new RegExp(
            `^(?:[ \t]*<?php)?[ \t/*#@]*${header}:(?<headerValue>.*)$`,
            "im"
          );

          let match;

          if ((match = lineContent.match(regex)) !== null && match.groups) {
            const headerValue = match.groups.headerValue
              .replace(/\s*(?:\*\/|\?>).*/, "")
              .trim();

            translations.push({
              translationId: createTranslationId(headerValue),
              msgid: headerValue,
              filename,
              line: line + 1,
            });
          }
        });
      });
    }

    return translations;
  };

  protected parseCodeTree = (ast: Node | Node[]): Translation[] => {
    const translations: Translation[] = [];

    if (Array.isArray(ast)) {
      for (const child of ast) {
        translations.push(...this.parseCodeTree(child));
      }
    } else {
      if ("kind" in ast && ast.kind === "call") {
        translations.push(...this.parseFunctionCall(ast as Call));
      }
      for (const property of propertiesContainingCalls) {
        if (
          property in ast &&
          ast[property] &&
          typeof ast[property] === "object"
        ) {
          translations.push(...this.parseCodeTree(ast[property]));
        }
      }
    }

    return translations;
  };

  protected parseComments = (comments: Comment[] | null): FileComments => {
    const fileComments: FileComments = {};

    for (const comment of comments || []) {
      let commentRegexp = new RegExp(
        `^\\/\\/\\s*${this.options.commentKeyword}(.*)$`,
        "im"
      );

      if (comment.kind === "commentblock") {
        commentRegexp = new RegExp(
          `(?:\\/\\*)?[\\s*]*${this.options.commentKeyword}(.*)\\s*(?:\\*\\/)$`,
          "im"
        );
      }

      const commentParts = commentRegexp.exec(comment.value);

      if (commentParts) {
        let lineNumber = comment.loc?.end.line || 1;
        if (comment.loc?.end.column === 0) {
          lineNumber--;
        }

        fileComments[lineNumber] = `${
          this.options.commentKeyword
        } ${commentParts[1].trim()}`;
      }
    }

    return fileComments;
  };

  protected getFunctionCallName = (call: Reference): string => {
    let methodName = "";

    if (
      call.kind === "propertylookup" &&
      call["what"].kind === "variable" &&
      call["offset"].kind === "identifier"
    ) {
      methodName = `$${call["what"].name}->${call["offset"].name}`;
    } else if (
      call.kind === "staticlookup" &&
      call["what"].kind === "variable" &&
      call["offset"].kind === "identifier"
    ) {
      methodName = `$${call["what"].name}::${call["offset"].name}`;
    } else if (call.kind === "name") {
      methodName = (call as unknown as Name).name;
      if ((call as unknown as Name).resolution === "fqn") {
        methodName = methodName.replace(/^\\/, "");
      }
    }

    return methodName;
  };

  protected parseFunctionCall = (ast: Call): Translation[] => {
    const translations: Translation[] = [];

    const functionName = this.getFunctionCallName(ast.what);

    const validFunction = this.options.gettextFunctions
      ?.filter((gettextFunction) => gettextFunction.name === functionName)
      .shift();

    if (validFunction && this.hasValidArgs(validFunction, ast.arguments)) {
      const functionArgs = this.parseFunctionArgs(ast.arguments);

      // Check textdomain
      if (
        !this.options.textdomain ||
        this.options.textdomain === functionArgs[functionArgs.length - 1]
      ) {
        const translation: Translation = {
          translationId: createTranslationId(functionArgs[0]),
          msgid: functionArgs[0],
          filename: this.filename,
          line: ast.loc?.start.line,
        };

        if (validFunction.contextPosition) {
          translation.context = functionArgs[validFunction.contextPosition - 1];
          translation.translationId = createTranslationId(
            functionArgs[0],
            translation.context
          );
        }

        if (validFunction.pluralPosition) {
          translation.plural = functionArgs[validFunction.pluralPosition - 1];
        }

        if (ast.loc?.start.line) {
          translation.comments = this.getComments(ast.loc?.start.line);
        }

        translations.push(translation);
      }
    }

    return translations;
  };

  protected hasValidArgs = (
    gettextFunction: GetTextFunction,
    functionArguments: Reference[]
  ): boolean => {
    const argsToCheck = [0];
    if (gettextFunction.contextPosition) {
      argsToCheck.push(gettextFunction.contextPosition - 1);
    }
    if (gettextFunction.pluralPosition) {
      argsToCheck.push(gettextFunction.pluralPosition - 1);
    }

    let isValid = true;
    argsToCheck.every((argPos) => {
      isValid =
        functionArguments[argPos] &&
        functionArguments[argPos].kind === "string";

      return isValid;
    });

    return isValid;
  };

  protected parseFunctionArgs = (functionArguments: Reference[]): string[] =>
    functionArguments.reduce(
      (argsArray: string[], arg: Reference): string[] => {
        if (arg.kind === "propertylookup" || arg.kind === "staticlookup") {
          argsArray.push(this.getFunctionCallName(arg as Lookup));
        } else if (arg.kind === "variable") {
          argsArray.push(`$${arg["name"]}`);
        } else if (arg.kind === "name" && arg["resolution"] === "uqn") {
          argsArray.push(arg["name"]);
        } else {
          argsArray.push(arg["value"]);
        }

        return argsArray;
      },
      []
    );

  protected getComments = (lineNumber: number): string[] => {
    const comments: string[] = Object.keys(this.fileComments)
      .filter(
        (key) =>
          lineNumber - parseInt(key) <= 2 && lineNumber - parseInt(key) >= 0
      )
      .reduce((arr, key) => {
        arr.push(this.fileComments[key]);
        return arr;
      }, [] as string[]);

    return comments;
  };
}
