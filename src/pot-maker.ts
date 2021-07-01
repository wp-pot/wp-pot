import { Translation } from ".";

type PotHeaders = {
  [key: string]: string;
};

export type PotOptions = {
  extraHeaders?: PotHeaders;
  defaultHeaders?: boolean;
  noFilePaths?: boolean;
  package?: string;
  bugReport?: string;
  lastTranslator?: string;
  team?: string;
};

// @internal
export const defaultPotOptions: PotOptions = {
  defaultHeaders: true,
};

type PotTranslation = Translation & {
  info: string;
};

type PotTranslations = {
  [translationId: string]: PotTranslation;
};

const defaultHeaders: PotHeaders = {
  "X-Poedit-Basepath": "..",
  "X-Poedit-KeywordsList":    "__;_e;_ex:1,2c;_n:1,2;_n_noop:1,2;_nx:1,2,4c;_nx_noop:1,2,3c;_x:1,2c;esc_attr__;esc_attr_e;esc_attr_x:1,2c;esc_html__;esc_html_e;esc_html_x:1,2c",
  "X-Poedit-SearchPath-0": ".",
  "X-Poedit-SearchPathExcluded-0": "*.js",
  "X-Poedit-SourceCharset": "UTF-8",
};

// @internal
export class PotMaker {
  protected options: PotOptions;

  public constructor(options: PotOptions) {
    this.options = options;
  }

  public generate = (translations: Translation[]): string => {
    const potTranslations = this.toPotTranslations(translations);

    let potContents = this.generateHeader();

    Object.entries(potTranslations).forEach(([, translation]) => {
      potContents += this.translationToPotString(translation);
    });

    return potContents;
  };

  protected toPotTranslations = (
    translations: Translation[]
  ): PotTranslations => {
    const potTranslations: PotTranslations = {};

    translations.forEach((translation) => {
      const translationId = translation.translationId;
      if (potTranslations[translationId]) {
        potTranslations[
          translationId
        ].info += `, ${translation.filename}:${translation.line}`;

        if (translation.comments) {
          potTranslations[translationId].comments?.push(
            ...translation.comments
          );
        }

        if (translation.plural) {
          potTranslations[translationId].plural = translation.plural;
        }
      } else {
        potTranslations[translationId] = {
          ...translation,
          ...{
            info: `${translation.filename}:${translation.line}`,
          },
        };
      }
    });

    return potTranslations;
  };

  protected generateHeader = (): string => {
    const year = new Date().getFullYear();
    const packageName = this.options.package || "";

    let contents = `# Copyright (C) ${year} ${(packageName + " ").trim()}
# This file is distributed under the same license as the ${packageName} package.
msgid ""
msgstr ""
"Project-Id-Version: ${packageName}\\n"
"MIME-Version: 1.0\\n"
"Content-Type: text/plain; charset=UTF-8\\n"
"Content-Transfer-Encoding: 8bit\\n"\n`;

    const headers: PotHeaders = {};
    if (this.options.defaultHeaders) {
      Object.assign(headers, defaultHeaders);
    }

    if (this.options.extraHeaders) {
      Object.assign(headers, this.options.extraHeaders);
    }

    if (this.options.bugReport) {
      headers["Report-Msgid-Bugs-To"] = this.options.bugReport;
    }

    if (this.options.lastTranslator) {
      headers["Last-Translator"] = this.options.lastTranslator;
    }

    if (this.options.team) {
      headers["Language-Team"] = this.options.team;
    }

    Object.entries(headers).forEach(([key, value]) => {
      contents += `"${key}: ${value}\\n"\n`;
    });

    contents += '"Plural-Forms: nplurals=2; plural=(n != 1);\\n"\n';
    contents += "\n";

    return contents;
  };

  protected translationToPotString = (translation: PotTranslation): string => {
    const output: string[] = [];

    translation.comments?.forEach((comment) => {
      output.push(`#. ${comment}`);
    });

    if (!this.options.noFilePaths) {
      // Unify paths for Unix and Windows
      output.push(`#: ${translation.info.replace(/\\/g, "/")}`);
    }

    if (translation.context) {
      output.push(this.formatMsgId("msgctxt", translation.context));
    }

    output.push(this.formatMsgId("msgid", translation.msgid));

    if (translation.plural) {
      output.push(this.formatMsgId("msgid_plural", translation.plural));
      output.push('msgstr[0] ""', 'msgstr[1] ""\n');
    } else {
      output.push('msgstr ""\n');
    }

    return `${output.join("\n")}\n`;
  };

  protected formatMsgId = (key: string, value: string): string => {
    const output = [];

    value = value.replace(/\\([\s\S])|(")/g, "\\$1$2");

    if (/\n/.test(value)) {
      output.push(`${key} ""`);
      output.push(`"${value.split(/\n/).join('\\n"\n"')}"`);
    } else {
      output.push(`${key} "${value}"`);
    }

    return output.join("\n");
  };
}
