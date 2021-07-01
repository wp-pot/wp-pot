import { readFileSync, writeFileSync } from "fs";
import globby, { GlobbyOptions } from "globby";
import { relative } from "path";
import {
  defaultPhpOptions,
  PhpOptions,
  PhpParser,
} from "./php-translation-parser";
import { defaultPotOptions, PotMaker, PotOptions } from "./pot-maker";

export type Options = {
  globOpts?: GlobbyOptions;
  php?: PhpOptions;
  pot?: PotOptions;
  pathsRelativeTo?: string;
};

// @internal
export const defaultOptions: Options = {
  php: defaultPhpOptions,
  pot: defaultPotOptions,
};

// @internal
export type Translation = {
  translationId: string;
  msgid: string;
  filename?: string;
  line?: number;
  comments?: string[];
  context?: string;
  plural?: string;
};

// @internal
export const createTranslationId = (msgid: string, context?: string): string =>
  `${msgid}${context || ""}`;

export class WP_Pot {
  private options: Options = {};
  private translations: Translation[] = [];

  constructor(options: Options = {}) {
    this.options = options;
    this.options.php = { ...defaultPhpOptions, ...options.php };
    this.options.pot = { ...defaultPotOptions, ...options.pot };
  }

  public parse(src: string | readonly string[]): WP_Pot {
    const files = globby.sync(src, this.options.globOpts);
    for (const filename of files) {
      if (
        this.options.php?.extensions?.some((extension) =>
          filename.endsWith("." + extension)
        )
      ) {
        this.parsePhpFile(filename);
      }
    }

    return this;
  }

  private parsePhpFile(filename: string): WP_Pot {
    const fileContent = readFileSync(filename).toString();
    const relativeFilename = relative(
      this.options.pathsRelativeTo || process.cwd(),
      filename
    ).replace(/\\/g, "/");
    this.translations.push(
      ...new PhpParser(this.options.php || {}).parseFile(
        fileContent,
        relativeFilename
      )
    );

    return this;
  }

  public generatePot(): string {
    return new PotMaker(this.options.pot || {}).generate(this.translations);
  }

  public writePot(outFile: string): void {
    writeFileSync(outFile, this.generatePot());
  }
}
