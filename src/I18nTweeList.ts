import JSZip from "jszip";
import type {LifeTimeCircleHook, LogWrapper} from "../../../dist-BeforeSC2/ModLoadController";
import type {SC2DataManager} from "../../../dist-BeforeSC2/SC2DataManager";
import type {AddonPluginHookPointEx} from "../../../dist-BeforeSC2/AddonPlugin";
import type {ModUtils} from "../../../dist-BeforeSC2/Utils";
import type {ModBootJson, ModBootJsonAddonPlugin, ModInfo} from "../../../dist-BeforeSC2/ModLoader";
import {isArray, isNil, isString, isObject, every, isObjectLike} from 'lodash';
import {ModZipReader} from "../../../dist-BeforeSC2/ModZipReader";
import {CacheRecord, PassageDataItem} from "../../../dist-BeforeSC2/SC2DataInfoCache";


export interface LanguageFileItem {
    language: string;
    tweeFileList: string[];
}

export interface I18nTweeListParams {
    mainLanguage: string;
    languageFile: LanguageFileItem[];
}

export interface ModRecord {
    mod: ModInfo;
    modZip: ModZipReader;
    params: I18nTweeListParams;
    state: ModLanguageState;
}

export function checkParams(params: any): params is I18nTweeListParams {
    return params
        && isObjectLike(params)
        && isString(params.mainLanguage)
        && isArray(params.languageFile)
        && every(params.languageFile, (T: LanguageFileItem) =>
            isArray(T.tweeFileList)
            && every(T.tweeFileList, TT => isString(TT))
            && isString(T.language)
        )
        ;
}

function findMaxPrefixItem(s: string, sl: string[]): [string, number] {
    let bestMatch = '';
    let bestMatchIndex = -1;
    sl.forEach((str, index) => {
        if (str.startsWith(s)) {
            if (str.length > bestMatch.length) {
                bestMatch = str;
                bestMatchIndex = index;
            }
            return;
        }
        if (s.startsWith(str)) {
            if (s.length > bestMatch.length) {
                bestMatch = str;
                bestMatchIndex = index;
            }
        }
    });
    return [bestMatch, bestMatchIndex];
}

export class ModLanguageState {
    constructor(
        private logger: LogWrapper,
        private mod: ModInfo,
        private modZip: ModZipReader,
        private params: I18nTweeListParams,
        private _language: string,   // navigator.language
        private _fallbackLanguage: string,
    ) {
        this.modName = this.mod.name;
        this.calcMainLanguage();
    }

    modName: string;

    get language() {
        return this._language;
    }

    get fallbackLanguage() {
        return this._fallbackLanguage;
    }

    _main_language: string | undefined;

    calcMainLanguage() {
        const langList = this.params.languageFile.map(T => T.language);
        if (!this._main_language) {
            if (langList.find(T => T === this._language)) {
                this._main_language = this._language;
            } else {
                const kl = findMaxPrefixItem(this._language, langList);
                if (kl[1] >= 0) {
                    this._main_language = kl[0];
                }
            }
        }
        if (!this._main_language) {
            console.log('[I18nTweeList] calcMainLanguage cannot calc main_language. use fallbackLanguage.', [this.modName, this._fallbackLanguage, langList]);
            this.logger.log(`[I18nTweeList] calcMainLanguage cannot calc main_language. use fallbackLanguage. [${this.modName}] [${this._main_language}] [${JSON.stringify(langList)}]`);
            this._main_language = this._fallbackLanguage;
        }
        console.log('[I18nTweeList] calcMainLanguage result:', [this.modName, this._main_language]);
        this.logger.log(`[I18nTweeList] calcMainLanguage mod[${this.modName}] language[${this._main_language}]`);
    }

    async updateModTweeList() {
        const lfi = this.params.languageFile.find(T => T.language === this.language);
        if (!lfi) {
            console.error('[I18nTweeList] updateModTweeList cannot get languageFile, invalid this.language.', [this.modName, this.params, this.language]);
            this.logger.error(`[I18nTweeList] updateModTweeList cannot get languageFile, invalid this.language. [${this.modName}] [${this.language}]`);
            return;
        }
        await this.modZip.refillCachePassageDataItems(
            lfi.tweeFileList,
            false,
        )
    }
}

export class I18nTweeList implements AddonPluginHookPointEx {
    private readonly logger: LogWrapper;

    constructor(
        public gSC2DataManager: SC2DataManager,
        public gModUtils: ModUtils,
    ) {
        this.logger = gModUtils.getLogger();
    }

    info: ModRecord[] = [];

    async registerMod(addonName: string, mod: ModInfo, modZip: ModZipReader) {
        const ad = mod.bootJson.addonPlugin?.find((T: ModBootJsonAddonPlugin) => {
            return T.modName === 'I18nTweeList'
                && T.addonName === 'I18nTweeListAddon';
        });
        if (isNil(ad)) {
            console.error('[I18nTweeList] cannot find I18nTweeListAddon', [addonName, mod, modZip]);
            this.logger.error(`[I18nTweeList] cannot find I18nTweeListAddon ${addonName} ${mod.name}`);
            return;
        }
        if (!checkParams(ad.params)) {
            console.error('[I18nTweeList] I18nTweeListAddon params invalid', [addonName, mod, modZip]);
            this.logger.error(`[I18nTweeList] I18nTweeListAddon params invalid ${addonName} ${mod.name}`);
            return;
        }
        const params: I18nTweeListParams = ad.params;
        this.info.push({
            mod,
            modZip,
            params,
            state: new ModLanguageState(
                this.logger,
                mod,
                modZip,
                params,
                this.gSC2DataManager.getLanguageManager().getLanguage(),
                params.mainLanguage,
            ),
        });
    }

    async beforePatchModToGame() {
        for (const ri of this.info) {
            await ri.state.updateModTweeList();
        }
    }

    init() {
    }
}
