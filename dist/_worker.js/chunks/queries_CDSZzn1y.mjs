globalThis.process ??= {}; globalThis.process.env ??= {};
import { l as logger } from './logger_AxPQEXXw.mjs';
import { j as getDefaultExportFromCjs } from './astro/server_D8h8_7uD.mjs';

/** Error thrown by the client. */
class LibsqlError extends Error {
    /** Machine-readable error code. */
    code;
    /** Raw numeric error code */
    rawCode;
    constructor(message, code, rawCode, cause) {
        if (code !== undefined) {
            message = `${code}: ${message}`;
        }
        super(message, { cause });
        this.code = code;
        this.rawCode = rawCode;
        this.name = "LibsqlError";
    }
}

// URI parser based on RFC 3986
// We can't use the standard `URL` object, because we want to support relative `file:` URLs like
// `file:relative/path/database.db`, which are not correct according to RFC 8089, which standardizes the
// `file` scheme.
function parseUri(text) {
    const match = URI_RE.exec(text);
    if (match === null) {
        throw new LibsqlError(`The URL '${text}' is not in a valid format`, "URL_INVALID");
    }
    const groups = match.groups;
    const scheme = groups["scheme"];
    const authority = groups["authority"] !== undefined
        ? parseAuthority(groups["authority"])
        : undefined;
    const path = percentDecode(groups["path"]);
    const query = groups["query"] !== undefined ? parseQuery(groups["query"]) : undefined;
    const fragment = groups["fragment"] !== undefined
        ? percentDecode(groups["fragment"])
        : undefined;
    return { scheme, authority, path, query, fragment };
}
const URI_RE = (() => {
    const SCHEME = "(?<scheme>[A-Za-z][A-Za-z.+-]*)";
    const AUTHORITY = "(?<authority>[^/?#]*)";
    const PATH = "(?<path>[^?#]*)";
    const QUERY = "(?<query>[^#]*)";
    const FRAGMENT = "(?<fragment>.*)";
    return new RegExp(`^${SCHEME}:(//${AUTHORITY})?${PATH}(\\?${QUERY})?(#${FRAGMENT})?$`, "su");
})();
function parseAuthority(text) {
    const match = AUTHORITY_RE.exec(text);
    if (match === null) {
        throw new LibsqlError("The authority part of the URL is not in a valid format", "URL_INVALID");
    }
    const groups = match.groups;
    const host = percentDecode(groups["host_br"] ?? groups["host"]);
    const port = groups["port"] ? parseInt(groups["port"], 10) : undefined;
    const userinfo = groups["username"] !== undefined
        ? {
            username: percentDecode(groups["username"]),
            password: groups["password"] !== undefined
                ? percentDecode(groups["password"])
                : undefined,
        }
        : undefined;
    return { host, port, userinfo };
}
const AUTHORITY_RE = (() => {
    return new RegExp(`^((?<username>[^:]*)(:(?<password>.*))?@)?((?<host>[^:\\[\\]]*)|(\\[(?<host_br>[^\\[\\]]*)\\]))(:(?<port>[0-9]*))?$`, "su");
})();
// Query string is parsed as application/x-www-form-urlencoded according to the Web URL standard:
// https://url.spec.whatwg.org/#urlencoded-parsing
function parseQuery(text) {
    const sequences = text.split("&");
    const pairs = [];
    for (const sequence of sequences) {
        if (sequence === "") {
            continue;
        }
        let key;
        let value;
        const splitIdx = sequence.indexOf("=");
        if (splitIdx < 0) {
            key = sequence;
            value = "";
        }
        else {
            key = sequence.substring(0, splitIdx);
            value = sequence.substring(splitIdx + 1);
        }
        pairs.push({
            key: percentDecode(key.replaceAll("+", " ")),
            value: percentDecode(value.replaceAll("+", " ")),
        });
    }
    return { pairs };
}
function percentDecode(text) {
    try {
        return decodeURIComponent(text);
    }
    catch (e) {
        if (e instanceof URIError) {
            throw new LibsqlError(`URL component has invalid percent encoding: ${e}`, "URL_INVALID", undefined, e);
        }
        throw e;
    }
}
function encodeBaseUrl(scheme, authority, path) {
    if (authority === undefined) {
        throw new LibsqlError(`URL with scheme ${JSON.stringify(scheme + ":")} requires authority (the "//" part)`, "URL_INVALID");
    }
    const schemeText = `${scheme}:`;
    const hostText = encodeHost(authority.host);
    const portText = encodePort(authority.port);
    const userinfoText = encodeUserinfo(authority.userinfo);
    const authorityText = `//${userinfoText}${hostText}${portText}`;
    let pathText = path.split("/").map(encodeURIComponent).join("/");
    if (pathText !== "" && !pathText.startsWith("/")) {
        pathText = "/" + pathText;
    }
    return new URL(`${schemeText}${authorityText}${pathText}`);
}
function encodeHost(host) {
    return host.includes(":") ? `[${encodeURI(host)}]` : encodeURI(host);
}
function encodePort(port) {
    return port !== undefined ? `:${port}` : "";
}
function encodeUserinfo(userinfo) {
    if (userinfo === undefined) {
        return "";
    }
    const usernameText = encodeURIComponent(userinfo.username);
    const passwordText = userinfo.password !== undefined
        ? `:${encodeURIComponent(userinfo.password)}`
        : "";
    return `${usernameText}${passwordText}@`;
}

/**
 *  base64.ts
 *
 *  Licensed under the BSD 3-Clause License.
 *    http://opensource.org/licenses/BSD-3-Clause
 *
 *  References:
 *    http://en.wikipedia.org/wiki/Base64
 *
 * @author Dan Kogai (https://github.com/dankogai)
 */
const version = '3.7.8';
/**
 * @deprecated use lowercase `version`.
 */
const VERSION = version;
const _hasBuffer = typeof Buffer === 'function';
const _TD = typeof TextDecoder === 'function' ? new TextDecoder() : undefined;
const _TE = typeof TextEncoder === 'function' ? new TextEncoder() : undefined;
const b64ch = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
const b64chs = Array.prototype.slice.call(b64ch);
const b64tab = ((a) => {
    let tab = {};
    a.forEach((c, i) => tab[c] = i);
    return tab;
})(b64chs);
const b64re = /^(?:[A-Za-z\d+\/]{4})*?(?:[A-Za-z\d+\/]{2}(?:==)?|[A-Za-z\d+\/]{3}=?)?$/;
const _fromCC = String.fromCharCode.bind(String);
const _U8Afrom = typeof Uint8Array.from === 'function'
    ? Uint8Array.from.bind(Uint8Array)
    : (it) => new Uint8Array(Array.prototype.slice.call(it, 0));
const _mkUriSafe = (src) => src
    .replace(/=/g, '').replace(/[+\/]/g, (m0) => m0 == '+' ? '-' : '_');
const _tidyB64 = (s) => s.replace(/[^A-Za-z0-9\+\/]/g, '');
/**
 * polyfill version of `btoa`
 */
const btoaPolyfill = (bin) => {
    // console.log('polyfilled');
    let u32, c0, c1, c2, asc = '';
    const pad = bin.length % 3;
    for (let i = 0; i < bin.length;) {
        if ((c0 = bin.charCodeAt(i++)) > 255 ||
            (c1 = bin.charCodeAt(i++)) > 255 ||
            (c2 = bin.charCodeAt(i++)) > 255)
            throw new TypeError('invalid character found');
        u32 = (c0 << 16) | (c1 << 8) | c2;
        asc += b64chs[u32 >> 18 & 63]
            + b64chs[u32 >> 12 & 63]
            + b64chs[u32 >> 6 & 63]
            + b64chs[u32 & 63];
    }
    return pad ? asc.slice(0, pad - 3) + "===".substring(pad) : asc;
};
/**
 * does what `window.btoa` of web browsers do.
 * @param {String} bin binary string
 * @returns {string} Base64-encoded string
 */
const _btoa = typeof btoa === 'function' ? (bin) => btoa(bin)
    : _hasBuffer ? (bin) => Buffer.from(bin, 'binary').toString('base64')
        : btoaPolyfill;
const _fromUint8Array = _hasBuffer
    ? (u8a) => Buffer.from(u8a).toString('base64')
    : (u8a) => {
        // cf. https://stackoverflow.com/questions/12710001/how-to-convert-uint8-array-to-base64-encoded-string/12713326#12713326
        const maxargs = 0x1000;
        let strs = [];
        for (let i = 0, l = u8a.length; i < l; i += maxargs) {
            strs.push(_fromCC.apply(null, u8a.subarray(i, i + maxargs)));
        }
        return _btoa(strs.join(''));
    };
/**
 * converts a Uint8Array to a Base64 string.
 * @param {boolean} [urlsafe] URL-and-filename-safe a la RFC4648 §5
 * @returns {string} Base64 string
 */
const fromUint8Array = (u8a, urlsafe = false) => urlsafe ? _mkUriSafe(_fromUint8Array(u8a)) : _fromUint8Array(u8a);
// This trick is found broken https://github.com/dankogai/js-base64/issues/130
// const utob = (src: string) => unescape(encodeURIComponent(src));
// reverting good old fationed regexp
const cb_utob = (c) => {
    if (c.length < 2) {
        var cc = c.charCodeAt(0);
        return cc < 0x80 ? c
            : cc < 0x800 ? (_fromCC(0xc0 | (cc >>> 6))
                + _fromCC(0x80 | (cc & 0x3f)))
                : (_fromCC(0xe0 | ((cc >>> 12) & 0x0f))
                    + _fromCC(0x80 | ((cc >>> 6) & 0x3f))
                    + _fromCC(0x80 | (cc & 0x3f)));
    }
    else {
        var cc = 0x10000
            + (c.charCodeAt(0) - 0xD800) * 0x400
            + (c.charCodeAt(1) - 0xDC00);
        return (_fromCC(0xf0 | ((cc >>> 18) & 0x07))
            + _fromCC(0x80 | ((cc >>> 12) & 0x3f))
            + _fromCC(0x80 | ((cc >>> 6) & 0x3f))
            + _fromCC(0x80 | (cc & 0x3f)));
    }
};
const re_utob = /[\uD800-\uDBFF][\uDC00-\uDFFFF]|[^\x00-\x7F]/g;
/**
 * @deprecated should have been internal use only.
 * @param {string} src UTF-8 string
 * @returns {string} UTF-16 string
 */
const utob = (u) => u.replace(re_utob, cb_utob);
//
const _encode = _hasBuffer
    ? (s) => Buffer.from(s, 'utf8').toString('base64')
    : _TE
        ? (s) => _fromUint8Array(_TE.encode(s))
        : (s) => _btoa(utob(s));
/**
 * converts a UTF-8-encoded string to a Base64 string.
 * @param {boolean} [urlsafe] if `true` make the result URL-safe
 * @returns {string} Base64 string
 */
const encode = (src, urlsafe = false) => urlsafe
    ? _mkUriSafe(_encode(src))
    : _encode(src);
/**
 * converts a UTF-8-encoded string to URL-safe Base64 RFC4648 §5.
 * @returns {string} Base64 string
 */
const encodeURI$1 = (src) => encode(src, true);
// This trick is found broken https://github.com/dankogai/js-base64/issues/130
// const btou = (src: string) => decodeURIComponent(escape(src));
// reverting good old fationed regexp
const re_btou = /[\xC0-\xDF][\x80-\xBF]|[\xE0-\xEF][\x80-\xBF]{2}|[\xF0-\xF7][\x80-\xBF]{3}/g;
const cb_btou = (cccc) => {
    switch (cccc.length) {
        case 4:
            var cp = ((0x07 & cccc.charCodeAt(0)) << 18)
                | ((0x3f & cccc.charCodeAt(1)) << 12)
                | ((0x3f & cccc.charCodeAt(2)) << 6)
                | (0x3f & cccc.charCodeAt(3)), offset = cp - 0x10000;
            return (_fromCC((offset >>> 10) + 0xD800)
                + _fromCC((offset & 0x3FF) + 0xDC00));
        case 3:
            return _fromCC(((0x0f & cccc.charCodeAt(0)) << 12)
                | ((0x3f & cccc.charCodeAt(1)) << 6)
                | (0x3f & cccc.charCodeAt(2)));
        default:
            return _fromCC(((0x1f & cccc.charCodeAt(0)) << 6)
                | (0x3f & cccc.charCodeAt(1)));
    }
};
/**
 * @deprecated should have been internal use only.
 * @param {string} src UTF-16 string
 * @returns {string} UTF-8 string
 */
const btou = (b) => b.replace(re_btou, cb_btou);
/**
 * polyfill version of `atob`
 */
const atobPolyfill = (asc) => {
    // console.log('polyfilled');
    asc = asc.replace(/\s+/g, '');
    if (!b64re.test(asc))
        throw new TypeError('malformed base64.');
    asc += '=='.slice(2 - (asc.length & 3));
    let u24, r1, r2;
    let binArray = []; // use array to avoid minor gc in loop
    for (let i = 0; i < asc.length;) {
        u24 = b64tab[asc.charAt(i++)] << 18
            | b64tab[asc.charAt(i++)] << 12
            | (r1 = b64tab[asc.charAt(i++)]) << 6
            | (r2 = b64tab[asc.charAt(i++)]);
        if (r1 === 64) {
            binArray.push(_fromCC(u24 >> 16 & 255));
        }
        else if (r2 === 64) {
            binArray.push(_fromCC(u24 >> 16 & 255, u24 >> 8 & 255));
        }
        else {
            binArray.push(_fromCC(u24 >> 16 & 255, u24 >> 8 & 255, u24 & 255));
        }
    }
    return binArray.join('');
};
/**
 * does what `window.atob` of web browsers do.
 * @param {String} asc Base64-encoded string
 * @returns {string} binary string
 */
const _atob = typeof atob === 'function' ? (asc) => atob(_tidyB64(asc))
    : _hasBuffer ? (asc) => Buffer.from(asc, 'base64').toString('binary')
        : atobPolyfill;
//
const _toUint8Array = _hasBuffer
    ? (a) => _U8Afrom(Buffer.from(a, 'base64'))
    : (a) => _U8Afrom(_atob(a).split('').map(c => c.charCodeAt(0)));
/**
 * converts a Base64 string to a Uint8Array.
 */
const toUint8Array = (a) => _toUint8Array(_unURI(a));
//
const _decode = _hasBuffer
    ? (a) => Buffer.from(a, 'base64').toString('utf8')
    : _TD
        ? (a) => _TD.decode(_toUint8Array(a))
        : (a) => btou(_atob(a));
const _unURI = (a) => _tidyB64(a.replace(/[-_]/g, (m0) => m0 == '-' ? '+' : '/'));
/**
 * converts a Base64 string to a UTF-8 string.
 * @param {String} src Base64 string.  Both normal and URL-safe are supported
 * @returns {string} UTF-8 string
 */
const decode = (src) => _decode(_unURI(src));
/**
 * check if a value is a valid Base64 string
 * @param {String} src a value to check
  */
const isValid = (src) => {
    if (typeof src !== 'string')
        return false;
    const s = src.replace(/\s+/g, '').replace(/={0,2}$/, '');
    return !/[^\s0-9a-zA-Z\+/]/.test(s) || !/[^\s0-9a-zA-Z\-_]/.test(s);
};
//
const _noEnum = (v) => {
    return {
        value: v, enumerable: false, writable: true, configurable: true
    };
};
/**
 * extend String.prototype with relevant methods
 */
const extendString = function () {
    const _add = (name, body) => Object.defineProperty(String.prototype, name, _noEnum(body));
    _add('fromBase64', function () { return decode(this); });
    _add('toBase64', function (urlsafe) { return encode(this, urlsafe); });
    _add('toBase64URI', function () { return encode(this, true); });
    _add('toBase64URL', function () { return encode(this, true); });
    _add('toUint8Array', function () { return toUint8Array(this); });
};
/**
 * extend Uint8Array.prototype with relevant methods
 */
const extendUint8Array = function () {
    const _add = (name, body) => Object.defineProperty(Uint8Array.prototype, name, _noEnum(body));
    _add('toBase64', function (urlsafe) { return fromUint8Array(this, urlsafe); });
    _add('toBase64URI', function () { return fromUint8Array(this, true); });
    _add('toBase64URL', function () { return fromUint8Array(this, true); });
};
/**
 * extend Builtin prototypes with relevant methods
 */
const extendBuiltins = () => {
    extendString();
    extendUint8Array();
};
const gBase64 = {
    version: version,
    VERSION: VERSION,
    atob: _atob,
    atobPolyfill: atobPolyfill,
    btoa: _btoa,
    btoaPolyfill: btoaPolyfill,
    fromBase64: decode,
    toBase64: encode,
    encode: encode,
    encodeURI: encodeURI$1,
    encodeURL: encodeURI$1,
    utob: utob,
    btou: btou,
    decode: decode,
    isValid: isValid,
    fromUint8Array: fromUint8Array,
    toUint8Array: toUint8Array,
    extendString: extendString,
    extendUint8Array: extendUint8Array,
    extendBuiltins: extendBuiltins
};

const supportedUrlLink = "https://github.com/libsql/libsql-client-ts#supported-urls";
function transactionModeToBegin(mode) {
    if (mode === "write") {
        return "BEGIN IMMEDIATE";
    }
    else if (mode === "read") {
        return "BEGIN TRANSACTION READONLY";
    }
    else if (mode === "deferred") {
        return "BEGIN DEFERRED";
    }
    else {
        throw RangeError('Unknown transaction mode, supported values are "write", "read" and "deferred"');
    }
}
class ResultSetImpl {
    columns;
    columnTypes;
    rows;
    rowsAffected;
    lastInsertRowid;
    constructor(columns, columnTypes, rows, rowsAffected, lastInsertRowid) {
        this.columns = columns;
        this.columnTypes = columnTypes;
        this.rows = rows;
        this.rowsAffected = rowsAffected;
        this.lastInsertRowid = lastInsertRowid;
    }
    toJSON() {
        return {
            columns: this.columns,
            columnTypes: this.columnTypes,
            rows: this.rows.map(rowToJson),
            rowsAffected: this.rowsAffected,
            lastInsertRowid: this.lastInsertRowid !== undefined
                ? "" + this.lastInsertRowid
                : null,
        };
    }
}
function rowToJson(row) {
    return Array.prototype.map.call(row, valueToJson);
}
function valueToJson(value) {
    if (typeof value === "bigint") {
        return "" + value;
    }
    else if (value instanceof ArrayBuffer) {
        return gBase64.fromUint8Array(new Uint8Array(value));
    }
    else {
        return value;
    }
}

const inMemoryMode = ":memory:";
function expandConfig(config, preferHttp) {
    if (typeof config !== "object") {
        // produce a reasonable error message in the common case where users type
        // `createClient("libsql://...")` instead of `createClient({url: "libsql://..."})`
        throw new TypeError(`Expected client configuration as object, got ${typeof config}`);
    }
    let { url, authToken, tls, intMode, concurrency } = config;
    // fill simple defaults right here
    concurrency = Math.max(0, concurrency || 20);
    intMode ??= "number";
    let connectionQueryParams = []; // recognized query parameters which we sanitize through white list of valid key-value pairs
    // convert plain :memory: url to URI format to make logic more uniform
    if (url === inMemoryMode) {
        url = "file::memory:";
    }
    // parse url parameters first and override config with update values
    const uri = parseUri(url);
    const originalUriScheme = uri.scheme.toLowerCase();
    const isInMemoryMode = originalUriScheme === "file" &&
        uri.path === inMemoryMode &&
        uri.authority === undefined;
    let queryParamsDef;
    if (isInMemoryMode) {
        queryParamsDef = {
            cache: {
                values: ["shared", "private"],
                update: (key, value) => connectionQueryParams.push(`${key}=${value}`),
            },
        };
    }
    else {
        queryParamsDef = {
            tls: {
                values: ["0", "1"],
                update: (_, value) => (tls = value === "1"),
            },
            authToken: {
                update: (_, value) => (authToken = value),
            },
        };
    }
    for (const { key, value } of uri.query?.pairs ?? []) {
        if (!Object.hasOwn(queryParamsDef, key)) {
            throw new LibsqlError(`Unsupported URL query parameter ${JSON.stringify(key)}`, "URL_PARAM_NOT_SUPPORTED");
        }
        const queryParamDef = queryParamsDef[key];
        if (queryParamDef.values !== undefined &&
            !queryParamDef.values.includes(value)) {
            throw new LibsqlError(`Unknown value for the "${key}" query argument: ${JSON.stringify(value)}. Supported values are: [${queryParamDef.values.map((x) => '"' + x + '"').join(", ")}]`, "URL_INVALID");
        }
        if (queryParamDef.update !== undefined) {
            queryParamDef?.update(key, value);
        }
    }
    // fill complex defaults & validate config
    const connectionQueryParamsString = connectionQueryParams.length === 0
        ? ""
        : `?${connectionQueryParams.join("&")}`;
    const path = uri.path + connectionQueryParamsString;
    let scheme;
    if (originalUriScheme === "libsql") {
        if (tls === false) {
            if (uri.authority?.port === undefined) {
                throw new LibsqlError('A "libsql:" URL with ?tls=0 must specify an explicit port', "URL_INVALID");
            }
            scheme = "http" ;
        }
        else {
            scheme = "https" ;
        }
    }
    else {
        scheme = originalUriScheme;
    }
    if (scheme === "http" || scheme === "ws") {
        tls ??= false;
    }
    else {
        tls ??= true;
    }
    if (scheme !== "http" &&
        scheme !== "ws" &&
        scheme !== "https" &&
        scheme !== "wss" &&
        scheme !== "file") {
        throw new LibsqlError('The client supports only "libsql:", "wss:", "ws:", "https:", "http:" and "file:" URLs, ' +
            `got ${JSON.stringify(uri.scheme + ":")}. ` +
            `For more information, please read ${supportedUrlLink}`, "URL_SCHEME_NOT_SUPPORTED");
    }
    if (intMode !== "number" && intMode !== "bigint" && intMode !== "string") {
        throw new TypeError(`Invalid value for intMode, expected "number", "bigint" or "string", got ${JSON.stringify(intMode)}`);
    }
    if (uri.fragment !== undefined) {
        throw new LibsqlError(`URL fragments are not supported: ${JSON.stringify("#" + uri.fragment)}`, "URL_INVALID");
    }
    if (isInMemoryMode) {
        return {
            scheme: "file",
            tls: false,
            path,
            intMode,
            concurrency,
            syncUrl: config.syncUrl,
            syncInterval: config.syncInterval,
            readYourWrites: config.readYourWrites,
            offline: config.offline,
            fetch: config.fetch,
            authToken: undefined,
            encryptionKey: undefined,
            authority: undefined,
        };
    }
    return {
        scheme,
        tls,
        authority: uri.authority,
        path,
        authToken,
        intMode,
        concurrency,
        encryptionKey: config.encryptionKey,
        syncUrl: config.syncUrl,
        syncInterval: config.syncInterval,
        readYourWrites: config.readYourWrites,
        offline: config.offline,
        fetch: config.fetch,
    };
}

let _WebSocket;
if (typeof WebSocket !== "undefined") {
    _WebSocket = WebSocket;
} else if (typeof global !== "undefined") {
    _WebSocket = global.WebSocket;
} else if (typeof window !== "undefined") {
    _WebSocket = window.WebSocket;
} else if (typeof self !== "undefined") {
    _WebSocket = self.WebSocket;
}

/** A client for the Hrana protocol (a "database connection pool"). */
class Client {
    /** @private */
    constructor() {
        this.intMode = "number";
    }
    /** Representation of integers returned from the database. See {@link IntMode}.
     *
     * This value is inherited by {@link Stream} objects created with {@link openStream}, but you can
     * override the integer mode for every stream by setting {@link Stream.intMode} on the stream.
     */
    intMode;
}

/** Generic error produced by the Hrana client. */
class ClientError extends Error {
    /** @private */
    constructor(message) {
        super(message);
        this.name = "ClientError";
    }
}
/** Error thrown when the server violates the protocol. */
class ProtoError extends ClientError {
    /** @private */
    constructor(message) {
        super(message);
        this.name = "ProtoError";
    }
}
/** Error thrown when the server returns an error response. */
class ResponseError extends ClientError {
    code;
    /** @internal */
    proto;
    /** @private */
    constructor(message, protoError) {
        super(message);
        this.name = "ResponseError";
        this.code = protoError.code;
        this.proto = protoError;
        this.stack = undefined;
    }
}
/** Error thrown when the client or stream is closed. */
class ClosedError extends ClientError {
    /** @private */
    constructor(message, cause) {
        if (cause !== undefined) {
            super(`${message}: ${cause}`);
            this.cause = cause;
        }
        else {
            super(message);
        }
        this.name = "ClosedError";
    }
}
/** Error thrown when the environment does not seem to support WebSockets. */
class WebSocketUnsupportedError extends ClientError {
    /** @private */
    constructor(message) {
        super(message);
        this.name = "WebSocketUnsupportedError";
    }
}
/** Error thrown when we encounter a WebSocket error. */
class WebSocketError extends ClientError {
    /** @private */
    constructor(message) {
        super(message);
        this.name = "WebSocketError";
    }
}
/** Error thrown when the HTTP server returns an error response. */
class HttpServerError extends ClientError {
    status;
    /** @private */
    constructor(message, status) {
        super(message);
        this.status = status;
        this.name = "HttpServerError";
    }
}
/** Error thrown when the protocol version is too low to support a feature. */
class ProtocolVersionError extends ClientError {
    /** @private */
    constructor(message) {
        super(message);
        this.name = "ProtocolVersionError";
    }
}
/** Error thrown when an internal client error happens. */
class InternalError extends ClientError {
    /** @private */
    constructor(message) {
        super(message);
        this.name = "InternalError";
    }
}
/** Error thrown when the API is misused. */
class MisuseError extends ClientError {
    /** @private */
    constructor(message) {
        super(message);
        this.name = "MisuseError";
    }
}

function string(value) {
    if (typeof value === "string") {
        return value;
    }
    throw typeError(value, "string");
}
function stringOpt(value) {
    if (value === null || value === undefined) {
        return undefined;
    }
    else if (typeof value === "string") {
        return value;
    }
    throw typeError(value, "string or null");
}
function number(value) {
    if (typeof value === "number") {
        return value;
    }
    throw typeError(value, "number");
}
function boolean(value) {
    if (typeof value === "boolean") {
        return value;
    }
    throw typeError(value, "boolean");
}
function array(value) {
    if (Array.isArray(value)) {
        return value;
    }
    throw typeError(value, "array");
}
function object(value) {
    if (value !== null && typeof value === "object" && !Array.isArray(value)) {
        return value;
    }
    throw typeError(value, "object");
}
function arrayObjectsMap(value, fun) {
    return array(value).map((elemValue) => fun(object(elemValue)));
}
function typeError(value, expected) {
    if (value === undefined) {
        return new ProtoError(`Expected ${expected}, but the property was missing`);
    }
    let received = typeof value;
    if (value === null) {
        received = "null";
    }
    else if (Array.isArray(value)) {
        received = "array";
    }
    return new ProtoError(`Expected ${expected}, received ${received}`);
}
function readJsonObject(value, fun) {
    return fun(object(value));
}

class ObjectWriter {
    #output;
    #isFirst;
    constructor(output) {
        this.#output = output;
        this.#isFirst = false;
    }
    begin() {
        this.#output.push('{');
        this.#isFirst = true;
    }
    end() {
        this.#output.push('}');
        this.#isFirst = false;
    }
    #key(name) {
        if (this.#isFirst) {
            this.#output.push('"');
            this.#isFirst = false;
        }
        else {
            this.#output.push(',"');
        }
        this.#output.push(name);
        this.#output.push('":');
    }
    string(name, value) {
        this.#key(name);
        this.#output.push(JSON.stringify(value));
    }
    stringRaw(name, value) {
        this.#key(name);
        this.#output.push('"');
        this.#output.push(value);
        this.#output.push('"');
    }
    number(name, value) {
        this.#key(name);
        this.#output.push("" + value);
    }
    boolean(name, value) {
        this.#key(name);
        this.#output.push(value ? "true" : "false");
    }
    object(name, value, valueFun) {
        this.#key(name);
        this.begin();
        valueFun(this, value);
        this.end();
    }
    arrayObjects(name, values, valueFun) {
        this.#key(name);
        this.#output.push('[');
        for (let i = 0; i < values.length; ++i) {
            if (i !== 0) {
                this.#output.push(',');
            }
            this.begin();
            valueFun(this, values[i]);
            this.end();
        }
        this.#output.push(']');
    }
}
function writeJsonObject(value, fun) {
    const output = [];
    const writer = new ObjectWriter(output);
    writer.begin();
    fun(writer, value);
    writer.end();
    return output.join("");
}

const VARINT = 0;
const FIXED_64 = 1;
const LENGTH_DELIMITED = 2;
const FIXED_32 = 5;

class MessageReader {
    #array;
    #view;
    #pos;
    constructor(array) {
        this.#array = array;
        this.#view = new DataView(array.buffer, array.byteOffset, array.byteLength);
        this.#pos = 0;
    }
    varint() {
        let value = 0;
        for (let shift = 0;; shift += 7) {
            const byte = this.#array[this.#pos++];
            value |= (byte & 0x7f) << shift;
            if (!(byte & 0x80)) {
                break;
            }
        }
        return value;
    }
    varintBig() {
        let value = 0n;
        for (let shift = 0n;; shift += 7n) {
            const byte = this.#array[this.#pos++];
            value |= BigInt(byte & 0x7f) << shift;
            if (!(byte & 0x80)) {
                break;
            }
        }
        return value;
    }
    bytes(length) {
        const array = new Uint8Array(this.#array.buffer, this.#array.byteOffset + this.#pos, length);
        this.#pos += length;
        return array;
    }
    double() {
        const value = this.#view.getFloat64(this.#pos, true);
        this.#pos += 8;
        return value;
    }
    skipVarint() {
        for (;;) {
            const byte = this.#array[this.#pos++];
            if (!(byte & 0x80)) {
                break;
            }
        }
    }
    skip(count) {
        this.#pos += count;
    }
    eof() {
        return this.#pos >= this.#array.byteLength;
    }
}
class FieldReader {
    #reader;
    #wireType;
    constructor(reader) {
        this.#reader = reader;
        this.#wireType = -1;
    }
    setup(wireType) {
        this.#wireType = wireType;
    }
    #expect(expectedWireType) {
        if (this.#wireType !== expectedWireType) {
            throw new ProtoError(`Expected wire type ${expectedWireType}, got ${this.#wireType}`);
        }
        this.#wireType = -1;
    }
    bytes() {
        this.#expect(LENGTH_DELIMITED);
        const length = this.#reader.varint();
        return this.#reader.bytes(length);
    }
    string() {
        return new TextDecoder().decode(this.bytes());
    }
    message(def) {
        return readProtobufMessage(this.bytes(), def);
    }
    int32() {
        this.#expect(VARINT);
        return this.#reader.varint();
    }
    uint32() {
        return this.int32();
    }
    bool() {
        return this.int32() !== 0;
    }
    uint64() {
        this.#expect(VARINT);
        return this.#reader.varintBig();
    }
    sint64() {
        const value = this.uint64();
        return (value >> 1n) ^ (-(value & 1n));
    }
    double() {
        this.#expect(FIXED_64);
        return this.#reader.double();
    }
    maybeSkip() {
        if (this.#wireType < 0) {
            return;
        }
        else if (this.#wireType === VARINT) {
            this.#reader.skipVarint();
        }
        else if (this.#wireType === FIXED_64) {
            this.#reader.skip(8);
        }
        else if (this.#wireType === LENGTH_DELIMITED) {
            const length = this.#reader.varint();
            this.#reader.skip(length);
        }
        else if (this.#wireType === FIXED_32) {
            this.#reader.skip(4);
        }
        else {
            throw new ProtoError(`Unexpected wire type ${this.#wireType}`);
        }
        this.#wireType = -1;
    }
}
function readProtobufMessage(data, def) {
    const msgReader = new MessageReader(data);
    const fieldReader = new FieldReader(msgReader);
    let value = def.default();
    while (!msgReader.eof()) {
        const key = msgReader.varint();
        const tag = key >> 3;
        const wireType = key & 0x7;
        fieldReader.setup(wireType);
        const tagFun = def[tag];
        if (tagFun !== undefined) {
            const returnedValue = tagFun(fieldReader, value);
            if (returnedValue !== undefined) {
                value = returnedValue;
            }
        }
        fieldReader.maybeSkip();
    }
    return value;
}

class MessageWriter {
    #buf;
    #array;
    #view;
    #pos;
    constructor() {
        this.#buf = new ArrayBuffer(256);
        this.#array = new Uint8Array(this.#buf);
        this.#view = new DataView(this.#buf);
        this.#pos = 0;
    }
    #ensure(extra) {
        if (this.#pos + extra <= this.#buf.byteLength) {
            return;
        }
        let newCap = this.#buf.byteLength;
        while (newCap < this.#pos + extra) {
            newCap *= 2;
        }
        const newBuf = new ArrayBuffer(newCap);
        const newArray = new Uint8Array(newBuf);
        const newView = new DataView(newBuf);
        newArray.set(new Uint8Array(this.#buf, 0, this.#pos));
        this.#buf = newBuf;
        this.#array = newArray;
        this.#view = newView;
    }
    #varint(value) {
        this.#ensure(5);
        value = 0 | value;
        do {
            let byte = value & 0x7f;
            value >>>= 7;
            byte |= (value ? 0x80 : 0);
            this.#array[this.#pos++] = byte;
        } while (value);
    }
    #varintBig(value) {
        this.#ensure(10);
        value = value & 0xffffffffffffffffn;
        do {
            let byte = Number(value & 0x7fn);
            value >>= 7n;
            byte |= (value ? 0x80 : 0);
            this.#array[this.#pos++] = byte;
        } while (value);
    }
    #tag(tag, wireType) {
        this.#varint((tag << 3) | wireType);
    }
    bytes(tag, value) {
        this.#tag(tag, LENGTH_DELIMITED);
        this.#varint(value.byteLength);
        this.#ensure(value.byteLength);
        this.#array.set(value, this.#pos);
        this.#pos += value.byteLength;
    }
    string(tag, value) {
        this.bytes(tag, new TextEncoder().encode(value));
    }
    message(tag, value, fun) {
        const writer = new MessageWriter();
        fun(writer, value);
        this.bytes(tag, writer.data());
    }
    int32(tag, value) {
        this.#tag(tag, VARINT);
        this.#varint(value);
    }
    uint32(tag, value) {
        this.int32(tag, value);
    }
    bool(tag, value) {
        this.int32(tag, value ? 1 : 0);
    }
    sint64(tag, value) {
        this.#tag(tag, VARINT);
        this.#varintBig((value << 1n) ^ (value >> 63n));
    }
    double(tag, value) {
        this.#tag(tag, FIXED_64);
        this.#ensure(8);
        this.#view.setFloat64(this.#pos, value, true);
        this.#pos += 8;
    }
    data() {
        return new Uint8Array(this.#buf, 0, this.#pos);
    }
}
function writeProtobufMessage(value, fun) {
    const w = new MessageWriter();
    fun(w, value);
    return w.data();
}

// An allocator of non-negative integer ids.
//
// This clever data structure has these "ideal" properties:
// - It consumes memory proportional to the number of used ids (which is optimal).
// - All operations are O(1) time.
// - The allocated ids are small (with a slight modification, we could always provide the smallest possible
// id).
class IdAlloc {
    // Set of all allocated ids
    #usedIds;
    // Set of all free ids lower than `#usedIds.size`
    #freeIds;
    constructor() {
        this.#usedIds = new Set();
        this.#freeIds = new Set();
    }
    // Returns an id that was free, and marks it as used.
    alloc() {
        // this "loop" is just a way to pick an arbitrary element from the `#freeIds` set
        for (const freeId of this.#freeIds) {
            this.#freeIds.delete(freeId);
            this.#usedIds.add(freeId);
            // maintain the invariant of `#freeIds`
            if (!this.#usedIds.has(this.#usedIds.size - 1)) {
                this.#freeIds.add(this.#usedIds.size - 1);
            }
            return freeId;
        }
        // the `#freeIds` set is empty, so there are no free ids lower than `#usedIds.size`
        // this means that `#usedIds` is a set that contains all numbers from 0 to `#usedIds.size - 1`,
        // so `#usedIds.size` is free
        const freeId = this.#usedIds.size;
        this.#usedIds.add(freeId);
        return freeId;
    }
    free(id) {
        if (!this.#usedIds.delete(id)) {
            throw new InternalError("Freeing an id that is not allocated");
        }
        // maintain the invariant of `#freeIds`
        this.#freeIds.delete(this.#usedIds.size);
        if (id < this.#usedIds.size) {
            this.#freeIds.add(id);
        }
    }
}

function impossible(value, message) {
    throw new InternalError(message);
}

function valueToProto(value) {
    if (value === null) {
        return null;
    }
    else if (typeof value === "string") {
        return value;
    }
    else if (typeof value === "number") {
        if (!Number.isFinite(value)) {
            throw new RangeError("Only finite numbers (not Infinity or NaN) can be passed as arguments");
        }
        return value;
    }
    else if (typeof value === "bigint") {
        if (value < minInteger || value > maxInteger) {
            throw new RangeError("This bigint value is too large to be represented as a 64-bit integer and passed as argument");
        }
        return value;
    }
    else if (typeof value === "boolean") {
        return value ? 1n : 0n;
    }
    else if (value instanceof ArrayBuffer) {
        return new Uint8Array(value);
    }
    else if (value instanceof Uint8Array) {
        return value;
    }
    else if (value instanceof Date) {
        return +value.valueOf();
    }
    else if (typeof value === "object") {
        return "" + value.toString();
    }
    else {
        throw new TypeError("Unsupported type of value");
    }
}
const minInteger = -9223372036854775808n;
const maxInteger = 9223372036854775807n;
function valueFromProto(value, intMode) {
    if (value === null) {
        return null;
    }
    else if (typeof value === "number") {
        return value;
    }
    else if (typeof value === "string") {
        return value;
    }
    else if (typeof value === "bigint") {
        if (intMode === "number") {
            const num = Number(value);
            if (!Number.isSafeInteger(num)) {
                throw new RangeError("Received integer which is too large to be safely represented as a JavaScript number");
            }
            return num;
        }
        else if (intMode === "bigint") {
            return value;
        }
        else if (intMode === "string") {
            return "" + value;
        }
        else {
            throw new MisuseError("Invalid value for IntMode");
        }
    }
    else if (value instanceof Uint8Array) {
        // TODO: we need to copy data from `Uint8Array` to return an `ArrayBuffer`. Perhaps we should add a
        // `blobMode` parameter, similar to `intMode`, which would allow the user to choose between receiving
        // `ArrayBuffer` (default, convenient) and `Uint8Array` (zero copy)?
        return value.slice().buffer;
    }
    else if (value === undefined) {
        throw new ProtoError("Received unrecognized type of Value");
    }
    else {
        throw impossible(value, "Impossible type of Value");
    }
}

function stmtResultFromProto(result) {
    return {
        affectedRowCount: result.affectedRowCount,
        lastInsertRowid: result.lastInsertRowid,
        columnNames: result.cols.map(col => col.name),
        columnDecltypes: result.cols.map(col => col.decltype),
    };
}
function rowsResultFromProto(result, intMode) {
    const stmtResult = stmtResultFromProto(result);
    const rows = result.rows.map(row => rowFromProto(stmtResult.columnNames, row, intMode));
    return { ...stmtResult, rows };
}
function rowResultFromProto(result, intMode) {
    const stmtResult = stmtResultFromProto(result);
    let row;
    if (result.rows.length > 0) {
        row = rowFromProto(stmtResult.columnNames, result.rows[0], intMode);
    }
    return { ...stmtResult, row };
}
function valueResultFromProto(result, intMode) {
    const stmtResult = stmtResultFromProto(result);
    let value;
    if (result.rows.length > 0 && stmtResult.columnNames.length > 0) {
        value = valueFromProto(result.rows[0][0], intMode);
    }
    return { ...stmtResult, value };
}
function rowFromProto(colNames, values, intMode) {
    const row = {};
    // make sure that the "length" property is not enumerable
    Object.defineProperty(row, "length", { value: values.length });
    for (let i = 0; i < values.length; ++i) {
        const value = valueFromProto(values[i], intMode);
        Object.defineProperty(row, i, { value });
        const colName = colNames[i];
        if (colName !== undefined && !Object.hasOwn(row, colName)) {
            Object.defineProperty(row, colName, { value, enumerable: true, configurable: true, writable: true });
        }
    }
    return row;
}
function errorFromProto(error) {
    return new ResponseError(error.message, error);
}

/** Text of an SQL statement cached on the server. */
class Sql {
    #owner;
    #sqlId;
    #closed;
    /** @private */
    constructor(owner, sqlId) {
        this.#owner = owner;
        this.#sqlId = sqlId;
        this.#closed = undefined;
    }
    /** @private */
    _getSqlId(owner) {
        if (this.#owner !== owner) {
            throw new MisuseError("Attempted to use SQL text opened with other object");
        }
        else if (this.#closed !== undefined) {
            throw new ClosedError("SQL text is closed", this.#closed);
        }
        return this.#sqlId;
    }
    /** Remove the SQL text from the server, releasing resouces. */
    close() {
        this._setClosed(new ClientError("SQL text was manually closed"));
    }
    /** @private */
    _setClosed(error) {
        if (this.#closed === undefined) {
            this.#closed = error;
            this.#owner._closeSql(this.#sqlId);
        }
    }
    /** True if the SQL text is closed (removed from the server). */
    get closed() {
        return this.#closed !== undefined;
    }
}
function sqlToProto(owner, sql) {
    if (sql instanceof Sql) {
        return { sqlId: sql._getSqlId(owner) };
    }
    else {
        return { sql: "" + sql };
    }
}

class Queue {
    #pushStack;
    #shiftStack;
    constructor() {
        this.#pushStack = [];
        this.#shiftStack = [];
    }
    get length() {
        return this.#pushStack.length + this.#shiftStack.length;
    }
    push(elem) {
        this.#pushStack.push(elem);
    }
    shift() {
        if (this.#shiftStack.length === 0 && this.#pushStack.length > 0) {
            this.#shiftStack = this.#pushStack.reverse();
            this.#pushStack = [];
        }
        return this.#shiftStack.pop();
    }
    first() {
        return this.#shiftStack.length !== 0
            ? this.#shiftStack[this.#shiftStack.length - 1]
            : this.#pushStack[0];
    }
}

/** A statement that can be evaluated by the database. Besides the SQL text, it also contains the positional
 * and named arguments. */
let Stmt$2 = class Stmt {
    /** The SQL statement text. */
    sql;
    /** @private */
    _args;
    /** @private */
    _namedArgs;
    /** Initialize the statement with given SQL text. */
    constructor(sql) {
        this.sql = sql;
        this._args = [];
        this._namedArgs = new Map();
    }
    /** Binds positional parameters from the given `values`. All previous positional bindings are cleared. */
    bindIndexes(values) {
        this._args.length = 0;
        for (const value of values) {
            this._args.push(valueToProto(value));
        }
        return this;
    }
    /** Binds a parameter by a 1-based index. */
    bindIndex(index, value) {
        if (index !== (index | 0) || index <= 0) {
            throw new RangeError("Index of a positional argument must be positive integer");
        }
        while (this._args.length < index) {
            this._args.push(null);
        }
        this._args[index - 1] = valueToProto(value);
        return this;
    }
    /** Binds a parameter by name. */
    bindName(name, value) {
        this._namedArgs.set(name, valueToProto(value));
        return this;
    }
    /** Clears all bindings. */
    unbindAll() {
        this._args.length = 0;
        this._namedArgs.clear();
        return this;
    }
};
function stmtToProto(sqlOwner, stmt, wantRows) {
    let inSql;
    let args = [];
    let namedArgs = [];
    if (stmt instanceof Stmt$2) {
        inSql = stmt.sql;
        args = stmt._args;
        for (const [name, value] of stmt._namedArgs.entries()) {
            namedArgs.push({ name, value });
        }
    }
    else if (Array.isArray(stmt)) {
        inSql = stmt[0];
        if (Array.isArray(stmt[1])) {
            args = stmt[1].map((arg) => valueToProto(arg));
        }
        else {
            namedArgs = Object.entries(stmt[1]).map(([name, value]) => {
                return { name, value: valueToProto(value) };
            });
        }
    }
    else {
        inSql = stmt;
    }
    const { sql, sqlId } = sqlToProto(sqlOwner, inSql);
    return { sql, sqlId, args, namedArgs, wantRows };
}

/** A builder for creating a batch and executing it on the server. */
let Batch$2 = class Batch {
    /** @private */
    _stream;
    #useCursor;
    /** @private */
    _steps;
    #executed;
    /** @private */
    constructor(stream, useCursor) {
        this._stream = stream;
        this.#useCursor = useCursor;
        this._steps = [];
        this.#executed = false;
    }
    /** Return a builder for adding a step to the batch. */
    step() {
        return new BatchStep$2(this);
    }
    /** Execute the batch. */
    execute() {
        if (this.#executed) {
            throw new MisuseError("This batch has already been executed");
        }
        this.#executed = true;
        const batch = {
            steps: this._steps.map((step) => step.proto),
        };
        if (this.#useCursor) {
            return executeCursor(this._stream, this._steps, batch);
        }
        else {
            return executeRegular(this._stream, this._steps, batch);
        }
    }
};
function executeRegular(stream, steps, batch) {
    return stream._batch(batch).then((result) => {
        for (let step = 0; step < steps.length; ++step) {
            const stepResult = result.stepResults.get(step);
            const stepError = result.stepErrors.get(step);
            steps[step].callback(stepResult, stepError);
        }
    });
}
async function executeCursor(stream, steps, batch) {
    const cursor = await stream._openCursor(batch);
    try {
        let nextStep = 0;
        let beginEntry = undefined;
        let rows = [];
        for (;;) {
            const entry = await cursor.next();
            if (entry === undefined) {
                break;
            }
            if (entry.type === "step_begin") {
                if (entry.step < nextStep || entry.step >= steps.length) {
                    throw new ProtoError("Server produced StepBeginEntry for unexpected step");
                }
                else if (beginEntry !== undefined) {
                    throw new ProtoError("Server produced StepBeginEntry before terminating previous step");
                }
                for (let step = nextStep; step < entry.step; ++step) {
                    steps[step].callback(undefined, undefined);
                }
                nextStep = entry.step + 1;
                beginEntry = entry;
                rows = [];
            }
            else if (entry.type === "step_end") {
                if (beginEntry === undefined) {
                    throw new ProtoError("Server produced StepEndEntry but no step is active");
                }
                const stmtResult = {
                    cols: beginEntry.cols,
                    rows,
                    affectedRowCount: entry.affectedRowCount,
                    lastInsertRowid: entry.lastInsertRowid,
                };
                steps[beginEntry.step].callback(stmtResult, undefined);
                beginEntry = undefined;
                rows = [];
            }
            else if (entry.type === "step_error") {
                if (beginEntry === undefined) {
                    if (entry.step >= steps.length) {
                        throw new ProtoError("Server produced StepErrorEntry for unexpected step");
                    }
                    for (let step = nextStep; step < entry.step; ++step) {
                        steps[step].callback(undefined, undefined);
                    }
                }
                else {
                    if (entry.step !== beginEntry.step) {
                        throw new ProtoError("Server produced StepErrorEntry for unexpected step");
                    }
                    beginEntry = undefined;
                    rows = [];
                }
                steps[entry.step].callback(undefined, entry.error);
                nextStep = entry.step + 1;
            }
            else if (entry.type === "row") {
                if (beginEntry === undefined) {
                    throw new ProtoError("Server produced RowEntry but no step is active");
                }
                rows.push(entry.row);
            }
            else if (entry.type === "error") {
                throw errorFromProto(entry.error);
            }
            else if (entry.type === "none") {
                throw new ProtoError("Server produced unrecognized CursorEntry");
            }
            else {
                throw impossible(entry, "Impossible CursorEntry");
            }
        }
        if (beginEntry !== undefined) {
            throw new ProtoError("Server closed Cursor before terminating active step");
        }
        for (let step = nextStep; step < steps.length; ++step) {
            steps[step].callback(undefined, undefined);
        }
    }
    finally {
        cursor.close();
    }
}
/** A builder for adding a step to the batch. */
let BatchStep$2 = class BatchStep {
    /** @private */
    _batch;
    #conds;
    /** @private */
    _index;
    /** @private */
    constructor(batch) {
        this._batch = batch;
        this.#conds = [];
        this._index = undefined;
    }
    /** Add the condition that needs to be satisfied to execute the statement. If you use this method multiple
     * times, we join the conditions with a logical AND. */
    condition(cond) {
        this.#conds.push(cond._proto);
        return this;
    }
    /** Add a statement that returns rows. */
    query(stmt) {
        return this.#add(stmt, true, rowsResultFromProto);
    }
    /** Add a statement that returns at most a single row. */
    queryRow(stmt) {
        return this.#add(stmt, true, rowResultFromProto);
    }
    /** Add a statement that returns at most a single value. */
    queryValue(stmt) {
        return this.#add(stmt, true, valueResultFromProto);
    }
    /** Add a statement without returning rows. */
    run(stmt) {
        return this.#add(stmt, false, stmtResultFromProto);
    }
    #add(inStmt, wantRows, fromProto) {
        if (this._index !== undefined) {
            throw new MisuseError("This BatchStep has already been added to the batch");
        }
        const stmt = stmtToProto(this._batch._stream._sqlOwner(), inStmt, wantRows);
        let condition;
        if (this.#conds.length === 0) {
            condition = undefined;
        }
        else if (this.#conds.length === 1) {
            condition = this.#conds[0];
        }
        else {
            condition = { type: "and", conds: this.#conds.slice() };
        }
        const proto = { stmt, condition };
        return new Promise((outputCallback, errorCallback) => {
            const callback = (stepResult, stepError) => {
                if (stepResult !== undefined && stepError !== undefined) {
                    errorCallback(new ProtoError("Server returned both result and error"));
                }
                else if (stepError !== undefined) {
                    errorCallback(errorFromProto(stepError));
                }
                else if (stepResult !== undefined) {
                    outputCallback(fromProto(stepResult, this._batch._stream.intMode));
                }
                else {
                    outputCallback(undefined);
                }
            };
            this._index = this._batch._steps.length;
            this._batch._steps.push({ proto, callback });
        });
    }
};
let BatchCond$2 = class BatchCond {
    /** @private */
    _batch;
    /** @private */
    _proto;
    /** @private */
    constructor(batch, proto) {
        this._batch = batch;
        this._proto = proto;
    }
    /** Create a condition that evaluates to true when the given step executes successfully.
     *
     * If the given step fails error or is skipped because its condition evaluated to false, this
     * condition evaluates to false.
     */
    static ok(step) {
        return new BatchCond(step._batch, { type: "ok", step: stepIndex(step) });
    }
    /** Create a condition that evaluates to true when the given step fails.
     *
     * If the given step succeeds or is skipped because its condition evaluated to false, this condition
     * evaluates to false.
     */
    static error(step) {
        return new BatchCond(step._batch, { type: "error", step: stepIndex(step) });
    }
    /** Create a condition that is a logical negation of another condition.
     */
    static not(cond) {
        return new BatchCond(cond._batch, { type: "not", cond: cond._proto });
    }
    /** Create a condition that is a logical AND of other conditions.
     */
    static and(batch, conds) {
        for (const cond of conds) {
            checkCondBatch(batch, cond);
        }
        return new BatchCond(batch, { type: "and", conds: conds.map(e => e._proto) });
    }
    /** Create a condition that is a logical OR of other conditions.
     */
    static or(batch, conds) {
        for (const cond of conds) {
            checkCondBatch(batch, cond);
        }
        return new BatchCond(batch, { type: "or", conds: conds.map(e => e._proto) });
    }
    /** Create a condition that evaluates to true when the SQL connection is in autocommit mode (not inside an
     * explicit transaction). This requires protocol version 3 or higher.
     */
    static isAutocommit(batch) {
        batch._stream.client()._ensureVersion(3, "BatchCond.isAutocommit()");
        return new BatchCond(batch, { type: "is_autocommit" });
    }
};
function stepIndex(step) {
    if (step._index === undefined) {
        throw new MisuseError("Cannot add a condition referencing a step that has not been added to the batch");
    }
    return step._index;
}
function checkCondBatch(expectedBatch, cond) {
    if (cond._batch !== expectedBatch) {
        throw new MisuseError("Cannot mix BatchCond objects for different Batch objects");
    }
}

function describeResultFromProto(result) {
    return {
        paramNames: result.params.map((p) => p.name),
        columns: result.cols,
        isExplain: result.isExplain,
        isReadonly: result.isReadonly,
    };
}

/** A stream for executing SQL statements (a "database connection"). */
class Stream {
    /** @private */
    constructor(intMode) {
        this.intMode = intMode;
    }
    /** Execute a statement and return rows. */
    query(stmt) {
        return this.#execute(stmt, true, rowsResultFromProto);
    }
    /** Execute a statement and return at most a single row. */
    queryRow(stmt) {
        return this.#execute(stmt, true, rowResultFromProto);
    }
    /** Execute a statement and return at most a single value. */
    queryValue(stmt) {
        return this.#execute(stmt, true, valueResultFromProto);
    }
    /** Execute a statement without returning rows. */
    run(stmt) {
        return this.#execute(stmt, false, stmtResultFromProto);
    }
    #execute(inStmt, wantRows, fromProto) {
        const stmt = stmtToProto(this._sqlOwner(), inStmt, wantRows);
        return this._execute(stmt).then((r) => fromProto(r, this.intMode));
    }
    /** Return a builder for creating and executing a batch.
     *
     * If `useCursor` is true, the batch will be executed using a Hrana cursor, which will stream results from
     * the server to the client, which consumes less memory on the server. This requires protocol version 3 or
     * higher.
     */
    batch(useCursor = false) {
        return new Batch$2(this, useCursor);
    }
    /** Parse and analyze a statement. This requires protocol version 2 or higher. */
    describe(inSql) {
        const protoSql = sqlToProto(this._sqlOwner(), inSql);
        return this._describe(protoSql).then(describeResultFromProto);
    }
    /** Execute a sequence of statements separated by semicolons. This requires protocol version 2 or higher.
     * */
    sequence(inSql) {
        const protoSql = sqlToProto(this._sqlOwner(), inSql);
        return this._sequence(protoSql);
    }
    /** Representation of integers returned from the database. See {@link IntMode}.
     *
     * This value affects the results of all operations on this stream.
     */
    intMode;
}

class Cursor {
}

const fetchChunkSize = 1000;
const fetchQueueSize = 10;
class WsCursor extends Cursor {
    #client;
    #stream;
    #cursorId;
    #entryQueue;
    #fetchQueue;
    #closed;
    #done;
    /** @private */
    constructor(client, stream, cursorId) {
        super();
        this.#client = client;
        this.#stream = stream;
        this.#cursorId = cursorId;
        this.#entryQueue = new Queue();
        this.#fetchQueue = new Queue();
        this.#closed = undefined;
        this.#done = false;
    }
    /** Fetch the next entry from the cursor. */
    async next() {
        for (;;) {
            if (this.#closed !== undefined) {
                throw new ClosedError("Cursor is closed", this.#closed);
            }
            while (!this.#done && this.#fetchQueue.length < fetchQueueSize) {
                this.#fetchQueue.push(this.#fetch());
            }
            const entry = this.#entryQueue.shift();
            if (this.#done || entry !== undefined) {
                return entry;
            }
            // we assume that `Cursor.next()` is never called concurrently
            await this.#fetchQueue.shift().then((response) => {
                if (response === undefined) {
                    return;
                }
                for (const entry of response.entries) {
                    this.#entryQueue.push(entry);
                }
                this.#done ||= response.done;
            });
        }
    }
    #fetch() {
        return this.#stream._sendCursorRequest(this, {
            type: "fetch_cursor",
            cursorId: this.#cursorId,
            maxCount: fetchChunkSize,
        }).then((resp) => resp, (error) => {
            this._setClosed(error);
            return undefined;
        });
    }
    /** @private */
    _setClosed(error) {
        if (this.#closed !== undefined) {
            return;
        }
        this.#closed = error;
        this.#stream._sendCursorRequest(this, {
            type: "close_cursor",
            cursorId: this.#cursorId,
        }).catch(() => undefined);
        this.#stream._cursorClosed(this);
    }
    /** Close the cursor. */
    close() {
        this._setClosed(new ClientError("Cursor was manually closed"));
    }
    /** True if the cursor is closed. */
    get closed() {
        return this.#closed !== undefined;
    }
}

class WsStream extends Stream {
    #client;
    #streamId;
    #queue;
    #cursor;
    #closing;
    #closed;
    /** @private */
    static open(client) {
        const streamId = client._streamIdAlloc.alloc();
        const stream = new WsStream(client, streamId);
        const responseCallback = () => undefined;
        const errorCallback = (e) => stream.#setClosed(e);
        const request = { type: "open_stream", streamId };
        client._sendRequest(request, { responseCallback, errorCallback });
        return stream;
    }
    /** @private */
    constructor(client, streamId) {
        super(client.intMode);
        this.#client = client;
        this.#streamId = streamId;
        this.#queue = new Queue();
        this.#cursor = undefined;
        this.#closing = false;
        this.#closed = undefined;
    }
    /** Get the {@link WsClient} object that this stream belongs to. */
    client() {
        return this.#client;
    }
    /** @private */
    _sqlOwner() {
        return this.#client;
    }
    /** @private */
    _execute(stmt) {
        return this.#sendStreamRequest({
            type: "execute",
            streamId: this.#streamId,
            stmt,
        }).then((response) => {
            return response.result;
        });
    }
    /** @private */
    _batch(batch) {
        return this.#sendStreamRequest({
            type: "batch",
            streamId: this.#streamId,
            batch,
        }).then((response) => {
            return response.result;
        });
    }
    /** @private */
    _describe(protoSql) {
        this.#client._ensureVersion(2, "describe()");
        return this.#sendStreamRequest({
            type: "describe",
            streamId: this.#streamId,
            sql: protoSql.sql,
            sqlId: protoSql.sqlId,
        }).then((response) => {
            return response.result;
        });
    }
    /** @private */
    _sequence(protoSql) {
        this.#client._ensureVersion(2, "sequence()");
        return this.#sendStreamRequest({
            type: "sequence",
            streamId: this.#streamId,
            sql: protoSql.sql,
            sqlId: protoSql.sqlId,
        }).then((_response) => {
            return undefined;
        });
    }
    /** Check whether the SQL connection underlying this stream is in autocommit state (i.e., outside of an
     * explicit transaction). This requires protocol version 3 or higher.
     */
    getAutocommit() {
        this.#client._ensureVersion(3, "getAutocommit()");
        return this.#sendStreamRequest({
            type: "get_autocommit",
            streamId: this.#streamId,
        }).then((response) => {
            return response.isAutocommit;
        });
    }
    #sendStreamRequest(request) {
        return new Promise((responseCallback, errorCallback) => {
            this.#pushToQueue({ type: "request", request, responseCallback, errorCallback });
        });
    }
    /** @private */
    _openCursor(batch) {
        this.#client._ensureVersion(3, "cursor");
        return new Promise((cursorCallback, errorCallback) => {
            this.#pushToQueue({ type: "cursor", batch, cursorCallback, errorCallback });
        });
    }
    /** @private */
    _sendCursorRequest(cursor, request) {
        if (cursor !== this.#cursor) {
            throw new InternalError("Cursor not associated with the stream attempted to execute a request");
        }
        return new Promise((responseCallback, errorCallback) => {
            if (this.#closed !== undefined) {
                errorCallback(new ClosedError("Stream is closed", this.#closed));
            }
            else {
                this.#client._sendRequest(request, { responseCallback, errorCallback });
            }
        });
    }
    /** @private */
    _cursorClosed(cursor) {
        if (cursor !== this.#cursor) {
            throw new InternalError("Cursor was closed, but it was not associated with the stream");
        }
        this.#cursor = undefined;
        this.#flushQueue();
    }
    #pushToQueue(entry) {
        if (this.#closed !== undefined) {
            entry.errorCallback(new ClosedError("Stream is closed", this.#closed));
        }
        else if (this.#closing) {
            entry.errorCallback(new ClosedError("Stream is closing", undefined));
        }
        else {
            this.#queue.push(entry);
            this.#flushQueue();
        }
    }
    #flushQueue() {
        for (;;) {
            const entry = this.#queue.first();
            if (entry === undefined && this.#cursor === undefined && this.#closing) {
                this.#setClosed(new ClientError("Stream was gracefully closed"));
                break;
            }
            else if (entry?.type === "request" && this.#cursor === undefined) {
                const { request, responseCallback, errorCallback } = entry;
                this.#queue.shift();
                this.#client._sendRequest(request, { responseCallback, errorCallback });
            }
            else if (entry?.type === "cursor" && this.#cursor === undefined) {
                const { batch, cursorCallback } = entry;
                this.#queue.shift();
                const cursorId = this.#client._cursorIdAlloc.alloc();
                const cursor = new WsCursor(this.#client, this, cursorId);
                const request = {
                    type: "open_cursor",
                    streamId: this.#streamId,
                    cursorId,
                    batch,
                };
                const responseCallback = () => undefined;
                const errorCallback = (e) => cursor._setClosed(e);
                this.#client._sendRequest(request, { responseCallback, errorCallback });
                this.#cursor = cursor;
                cursorCallback(cursor);
            }
            else {
                break;
            }
        }
    }
    #setClosed(error) {
        if (this.#closed !== undefined) {
            return;
        }
        this.#closed = error;
        if (this.#cursor !== undefined) {
            this.#cursor._setClosed(error);
        }
        for (;;) {
            const entry = this.#queue.shift();
            if (entry !== undefined) {
                entry.errorCallback(error);
            }
            else {
                break;
            }
        }
        const request = { type: "close_stream", streamId: this.#streamId };
        const responseCallback = () => this.#client._streamIdAlloc.free(this.#streamId);
        const errorCallback = () => undefined;
        this.#client._sendRequest(request, { responseCallback, errorCallback });
    }
    /** Immediately close the stream. */
    close() {
        this.#setClosed(new ClientError("Stream was manually closed"));
    }
    /** Gracefully close the stream. */
    closeGracefully() {
        this.#closing = true;
        this.#flushQueue();
    }
    /** True if the stream is closed or closing. */
    get closed() {
        return this.#closed !== undefined || this.#closing;
    }
}

function Stmt$1(w, msg) {
    if (msg.sql !== undefined) {
        w.string("sql", msg.sql);
    }
    if (msg.sqlId !== undefined) {
        w.number("sql_id", msg.sqlId);
    }
    w.arrayObjects("args", msg.args, Value$3);
    w.arrayObjects("named_args", msg.namedArgs, NamedArg$1);
    w.boolean("want_rows", msg.wantRows);
}
function NamedArg$1(w, msg) {
    w.string("name", msg.name);
    w.object("value", msg.value, Value$3);
}
function Batch$1(w, msg) {
    w.arrayObjects("steps", msg.steps, BatchStep$1);
}
function BatchStep$1(w, msg) {
    if (msg.condition !== undefined) {
        w.object("condition", msg.condition, BatchCond$1);
    }
    w.object("stmt", msg.stmt, Stmt$1);
}
function BatchCond$1(w, msg) {
    w.stringRaw("type", msg.type);
    if (msg.type === "ok" || msg.type === "error") {
        w.number("step", msg.step);
    }
    else if (msg.type === "not") {
        w.object("cond", msg.cond, BatchCond$1);
    }
    else if (msg.type === "and" || msg.type === "or") {
        w.arrayObjects("conds", msg.conds, BatchCond$1);
    }
    else if (msg.type === "is_autocommit") ;
    else {
        throw impossible(msg, "Impossible type of BatchCond");
    }
}
function Value$3(w, msg) {
    if (msg === null) {
        w.stringRaw("type", "null");
    }
    else if (typeof msg === "bigint") {
        w.stringRaw("type", "integer");
        w.stringRaw("value", "" + msg);
    }
    else if (typeof msg === "number") {
        w.stringRaw("type", "float");
        w.number("value", msg);
    }
    else if (typeof msg === "string") {
        w.stringRaw("type", "text");
        w.string("value", msg);
    }
    else if (msg instanceof Uint8Array) {
        w.stringRaw("type", "blob");
        w.stringRaw("base64", gBase64.fromUint8Array(msg));
    }
    else if (msg === undefined) ;
    else {
        throw impossible(msg, "Impossible type of Value");
    }
}

function ClientMsg$1(w, msg) {
    w.stringRaw("type", msg.type);
    if (msg.type === "hello") {
        if (msg.jwt !== undefined) {
            w.string("jwt", msg.jwt);
        }
    }
    else if (msg.type === "request") {
        w.number("request_id", msg.requestId);
        w.object("request", msg.request, Request$1);
    }
    else {
        throw impossible(msg, "Impossible type of ClientMsg");
    }
}
function Request$1(w, msg) {
    w.stringRaw("type", msg.type);
    if (msg.type === "open_stream") {
        w.number("stream_id", msg.streamId);
    }
    else if (msg.type === "close_stream") {
        w.number("stream_id", msg.streamId);
    }
    else if (msg.type === "execute") {
        w.number("stream_id", msg.streamId);
        w.object("stmt", msg.stmt, Stmt$1);
    }
    else if (msg.type === "batch") {
        w.number("stream_id", msg.streamId);
        w.object("batch", msg.batch, Batch$1);
    }
    else if (msg.type === "open_cursor") {
        w.number("stream_id", msg.streamId);
        w.number("cursor_id", msg.cursorId);
        w.object("batch", msg.batch, Batch$1);
    }
    else if (msg.type === "close_cursor") {
        w.number("cursor_id", msg.cursorId);
    }
    else if (msg.type === "fetch_cursor") {
        w.number("cursor_id", msg.cursorId);
        w.number("max_count", msg.maxCount);
    }
    else if (msg.type === "sequence") {
        w.number("stream_id", msg.streamId);
        if (msg.sql !== undefined) {
            w.string("sql", msg.sql);
        }
        if (msg.sqlId !== undefined) {
            w.number("sql_id", msg.sqlId);
        }
    }
    else if (msg.type === "describe") {
        w.number("stream_id", msg.streamId);
        if (msg.sql !== undefined) {
            w.string("sql", msg.sql);
        }
        if (msg.sqlId !== undefined) {
            w.number("sql_id", msg.sqlId);
        }
    }
    else if (msg.type === "store_sql") {
        w.number("sql_id", msg.sqlId);
        w.string("sql", msg.sql);
    }
    else if (msg.type === "close_sql") {
        w.number("sql_id", msg.sqlId);
    }
    else if (msg.type === "get_autocommit") {
        w.number("stream_id", msg.streamId);
    }
    else {
        throw impossible(msg, "Impossible type of Request");
    }
}

function Stmt(w, msg) {
    if (msg.sql !== undefined) {
        w.string(1, msg.sql);
    }
    if (msg.sqlId !== undefined) {
        w.int32(2, msg.sqlId);
    }
    for (const arg of msg.args) {
        w.message(3, arg, Value$2);
    }
    for (const arg of msg.namedArgs) {
        w.message(4, arg, NamedArg);
    }
    w.bool(5, msg.wantRows);
}
function NamedArg(w, msg) {
    w.string(1, msg.name);
    w.message(2, msg.value, Value$2);
}
function Batch(w, msg) {
    for (const step of msg.steps) {
        w.message(1, step, BatchStep);
    }
}
function BatchStep(w, msg) {
    if (msg.condition !== undefined) {
        w.message(1, msg.condition, BatchCond);
    }
    w.message(2, msg.stmt, Stmt);
}
function BatchCond(w, msg) {
    if (msg.type === "ok") {
        w.uint32(1, msg.step);
    }
    else if (msg.type === "error") {
        w.uint32(2, msg.step);
    }
    else if (msg.type === "not") {
        w.message(3, msg.cond, BatchCond);
    }
    else if (msg.type === "and") {
        w.message(4, msg.conds, BatchCondList);
    }
    else if (msg.type === "or") {
        w.message(5, msg.conds, BatchCondList);
    }
    else if (msg.type === "is_autocommit") {
        w.message(6, undefined, Empty);
    }
    else {
        throw impossible(msg, "Impossible type of BatchCond");
    }
}
function BatchCondList(w, msg) {
    for (const cond of msg) {
        w.message(1, cond, BatchCond);
    }
}
function Value$2(w, msg) {
    if (msg === null) {
        w.message(1, undefined, Empty);
    }
    else if (typeof msg === "bigint") {
        w.sint64(2, msg);
    }
    else if (typeof msg === "number") {
        w.double(3, msg);
    }
    else if (typeof msg === "string") {
        w.string(4, msg);
    }
    else if (msg instanceof Uint8Array) {
        w.bytes(5, msg);
    }
    else if (msg === undefined) ;
    else {
        throw impossible(msg, "Impossible type of Value");
    }
}
function Empty(_w, _msg) {
    // do nothing
}

function ClientMsg(w, msg) {
    if (msg.type === "hello") {
        w.message(1, msg, HelloMsg);
    }
    else if (msg.type === "request") {
        w.message(2, msg, RequestMsg);
    }
    else {
        throw impossible(msg, "Impossible type of ClientMsg");
    }
}
function HelloMsg(w, msg) {
    if (msg.jwt !== undefined) {
        w.string(1, msg.jwt);
    }
}
function RequestMsg(w, msg) {
    w.int32(1, msg.requestId);
    const request = msg.request;
    if (request.type === "open_stream") {
        w.message(2, request, OpenStreamReq);
    }
    else if (request.type === "close_stream") {
        w.message(3, request, CloseStreamReq$1);
    }
    else if (request.type === "execute") {
        w.message(4, request, ExecuteReq);
    }
    else if (request.type === "batch") {
        w.message(5, request, BatchReq);
    }
    else if (request.type === "open_cursor") {
        w.message(6, request, OpenCursorReq);
    }
    else if (request.type === "close_cursor") {
        w.message(7, request, CloseCursorReq);
    }
    else if (request.type === "fetch_cursor") {
        w.message(8, request, FetchCursorReq);
    }
    else if (request.type === "sequence") {
        w.message(9, request, SequenceReq);
    }
    else if (request.type === "describe") {
        w.message(10, request, DescribeReq);
    }
    else if (request.type === "store_sql") {
        w.message(11, request, StoreSqlReq);
    }
    else if (request.type === "close_sql") {
        w.message(12, request, CloseSqlReq);
    }
    else if (request.type === "get_autocommit") {
        w.message(13, request, GetAutocommitReq);
    }
    else {
        throw impossible(request, "Impossible type of Request");
    }
}
function OpenStreamReq(w, msg) {
    w.int32(1, msg.streamId);
}
function CloseStreamReq$1(w, msg) {
    w.int32(1, msg.streamId);
}
function ExecuteReq(w, msg) {
    w.int32(1, msg.streamId);
    w.message(2, msg.stmt, Stmt);
}
function BatchReq(w, msg) {
    w.int32(1, msg.streamId);
    w.message(2, msg.batch, Batch);
}
function OpenCursorReq(w, msg) {
    w.int32(1, msg.streamId);
    w.int32(2, msg.cursorId);
    w.message(3, msg.batch, Batch);
}
function CloseCursorReq(w, msg) {
    w.int32(1, msg.cursorId);
}
function FetchCursorReq(w, msg) {
    w.int32(1, msg.cursorId);
    w.uint32(2, msg.maxCount);
}
function SequenceReq(w, msg) {
    w.int32(1, msg.streamId);
    if (msg.sql !== undefined) {
        w.string(2, msg.sql);
    }
    if (msg.sqlId !== undefined) {
        w.int32(3, msg.sqlId);
    }
}
function DescribeReq(w, msg) {
    w.int32(1, msg.streamId);
    if (msg.sql !== undefined) {
        w.string(2, msg.sql);
    }
    if (msg.sqlId !== undefined) {
        w.int32(3, msg.sqlId);
    }
}
function StoreSqlReq(w, msg) {
    w.int32(1, msg.sqlId);
    w.string(2, msg.sql);
}
function CloseSqlReq(w, msg) {
    w.int32(1, msg.sqlId);
}
function GetAutocommitReq(w, msg) {
    w.int32(1, msg.streamId);
}

function Error$2(obj) {
    const message = string(obj["message"]);
    const code = stringOpt(obj["code"]);
    return { message, code };
}
function StmtResult$1(obj) {
    const cols = arrayObjectsMap(obj["cols"], Col$1);
    const rows = array(obj["rows"]).map((rowObj) => arrayObjectsMap(rowObj, Value$1));
    const affectedRowCount = number(obj["affected_row_count"]);
    const lastInsertRowidStr = stringOpt(obj["last_insert_rowid"]);
    const lastInsertRowid = lastInsertRowidStr !== undefined
        ? BigInt(lastInsertRowidStr) : undefined;
    return { cols, rows, affectedRowCount, lastInsertRowid };
}
function Col$1(obj) {
    const name = stringOpt(obj["name"]);
    const decltype = stringOpt(obj["decltype"]);
    return { name, decltype };
}
function BatchResult$1(obj) {
    const stepResults = new Map();
    array(obj["step_results"]).forEach((value, i) => {
        if (value !== null) {
            stepResults.set(i, StmtResult$1(object(value)));
        }
    });
    const stepErrors = new Map();
    array(obj["step_errors"]).forEach((value, i) => {
        if (value !== null) {
            stepErrors.set(i, Error$2(object(value)));
        }
    });
    return { stepResults, stepErrors };
}
function CursorEntry$1(obj) {
    const type = string(obj["type"]);
    if (type === "step_begin") {
        const step = number(obj["step"]);
        const cols = arrayObjectsMap(obj["cols"], Col$1);
        return { type: "step_begin", step, cols };
    }
    else if (type === "step_end") {
        const affectedRowCount = number(obj["affected_row_count"]);
        const lastInsertRowidStr = stringOpt(obj["last_insert_rowid"]);
        const lastInsertRowid = lastInsertRowidStr !== undefined
            ? BigInt(lastInsertRowidStr) : undefined;
        return { type: "step_end", affectedRowCount, lastInsertRowid };
    }
    else if (type === "step_error") {
        const step = number(obj["step"]);
        const error = Error$2(object(obj["error"]));
        return { type: "step_error", step, error };
    }
    else if (type === "row") {
        const row = arrayObjectsMap(obj["row"], Value$1);
        return { type: "row", row };
    }
    else if (type === "error") {
        const error = Error$2(object(obj["error"]));
        return { type: "error", error };
    }
    else {
        throw new ProtoError("Unexpected type of CursorEntry");
    }
}
function DescribeResult$1(obj) {
    const params = arrayObjectsMap(obj["params"], DescribeParam$1);
    const cols = arrayObjectsMap(obj["cols"], DescribeCol$1);
    const isExplain = boolean(obj["is_explain"]);
    const isReadonly = boolean(obj["is_readonly"]);
    return { params, cols, isExplain, isReadonly };
}
function DescribeParam$1(obj) {
    const name = stringOpt(obj["name"]);
    return { name };
}
function DescribeCol$1(obj) {
    const name = string(obj["name"]);
    const decltype = stringOpt(obj["decltype"]);
    return { name, decltype };
}
function Value$1(obj) {
    const type = string(obj["type"]);
    if (type === "null") {
        return null;
    }
    else if (type === "integer") {
        const value = string(obj["value"]);
        return BigInt(value);
    }
    else if (type === "float") {
        return number(obj["value"]);
    }
    else if (type === "text") {
        return string(obj["value"]);
    }
    else if (type === "blob") {
        return gBase64.toUint8Array(string(obj["base64"]));
    }
    else {
        throw new ProtoError("Unexpected type of Value");
    }
}

function ServerMsg$1(obj) {
    const type = string(obj["type"]);
    if (type === "hello_ok") {
        return { type: "hello_ok" };
    }
    else if (type === "hello_error") {
        const error = Error$2(object(obj["error"]));
        return { type: "hello_error", error };
    }
    else if (type === "response_ok") {
        const requestId = number(obj["request_id"]);
        const response = Response(object(obj["response"]));
        return { type: "response_ok", requestId, response };
    }
    else if (type === "response_error") {
        const requestId = number(obj["request_id"]);
        const error = Error$2(object(obj["error"]));
        return { type: "response_error", requestId, error };
    }
    else {
        throw new ProtoError("Unexpected type of ServerMsg");
    }
}
function Response(obj) {
    const type = string(obj["type"]);
    if (type === "open_stream") {
        return { type: "open_stream" };
    }
    else if (type === "close_stream") {
        return { type: "close_stream" };
    }
    else if (type === "execute") {
        const result = StmtResult$1(object(obj["result"]));
        return { type: "execute", result };
    }
    else if (type === "batch") {
        const result = BatchResult$1(object(obj["result"]));
        return { type: "batch", result };
    }
    else if (type === "open_cursor") {
        return { type: "open_cursor" };
    }
    else if (type === "close_cursor") {
        return { type: "close_cursor" };
    }
    else if (type === "fetch_cursor") {
        const entries = arrayObjectsMap(obj["entries"], CursorEntry$1);
        const done = boolean(obj["done"]);
        return { type: "fetch_cursor", entries, done };
    }
    else if (type === "sequence") {
        return { type: "sequence" };
    }
    else if (type === "describe") {
        const result = DescribeResult$1(object(obj["result"]));
        return { type: "describe", result };
    }
    else if (type === "store_sql") {
        return { type: "store_sql" };
    }
    else if (type === "close_sql") {
        return { type: "close_sql" };
    }
    else if (type === "get_autocommit") {
        const isAutocommit = boolean(obj["is_autocommit"]);
        return { type: "get_autocommit", isAutocommit };
    }
    else {
        throw new ProtoError("Unexpected type of Response");
    }
}

const Error$1 = {
    default() { return { message: "", code: undefined }; },
    1(r, msg) { msg.message = r.string(); },
    2(r, msg) { msg.code = r.string(); },
};
const StmtResult = {
    default() {
        return {
            cols: [],
            rows: [],
            affectedRowCount: 0,
            lastInsertRowid: undefined,
        };
    },
    1(r, msg) { msg.cols.push(r.message(Col)); },
    2(r, msg) { msg.rows.push(r.message(Row)); },
    3(r, msg) { msg.affectedRowCount = Number(r.uint64()); },
    4(r, msg) { msg.lastInsertRowid = r.sint64(); },
};
const Col = {
    default() { return { name: undefined, decltype: undefined }; },
    1(r, msg) { msg.name = r.string(); },
    2(r, msg) { msg.decltype = r.string(); },
};
const Row = {
    default() { return []; },
    1(r, msg) { msg.push(r.message(Value)); },
};
const BatchResult = {
    default() { return { stepResults: new Map(), stepErrors: new Map() }; },
    1(r, msg) {
        const [key, value] = r.message(BatchResultStepResult);
        msg.stepResults.set(key, value);
    },
    2(r, msg) {
        const [key, value] = r.message(BatchResultStepError);
        msg.stepErrors.set(key, value);
    },
};
const BatchResultStepResult = {
    default() { return [0, StmtResult.default()]; },
    1(r, msg) { msg[0] = r.uint32(); },
    2(r, msg) { msg[1] = r.message(StmtResult); },
};
const BatchResultStepError = {
    default() { return [0, Error$1.default()]; },
    1(r, msg) { msg[0] = r.uint32(); },
    2(r, msg) { msg[1] = r.message(Error$1); },
};
const CursorEntry = {
    default() { return { type: "none" }; },
    1(r) { return r.message(StepBeginEntry); },
    2(r) { return r.message(StepEndEntry); },
    3(r) { return r.message(StepErrorEntry); },
    4(r) { return { type: "row", row: r.message(Row) }; },
    5(r) { return { type: "error", error: r.message(Error$1) }; },
};
const StepBeginEntry = {
    default() { return { type: "step_begin", step: 0, cols: [] }; },
    1(r, msg) { msg.step = r.uint32(); },
    2(r, msg) { msg.cols.push(r.message(Col)); },
};
const StepEndEntry = {
    default() {
        return {
            type: "step_end",
            affectedRowCount: 0,
            lastInsertRowid: undefined,
        };
    },
    1(r, msg) { msg.affectedRowCount = r.uint32(); },
    2(r, msg) { msg.lastInsertRowid = r.uint64(); },
};
const StepErrorEntry = {
    default() {
        return {
            type: "step_error",
            step: 0,
            error: Error$1.default(),
        };
    },
    1(r, msg) { msg.step = r.uint32(); },
    2(r, msg) { msg.error = r.message(Error$1); },
};
const DescribeResult = {
    default() {
        return {
            params: [],
            cols: [],
            isExplain: false,
            isReadonly: false,
        };
    },
    1(r, msg) { msg.params.push(r.message(DescribeParam)); },
    2(r, msg) { msg.cols.push(r.message(DescribeCol)); },
    3(r, msg) { msg.isExplain = r.bool(); },
    4(r, msg) { msg.isReadonly = r.bool(); },
};
const DescribeParam = {
    default() { return { name: undefined }; },
    1(r, msg) { msg.name = r.string(); },
};
const DescribeCol = {
    default() { return { name: "", decltype: undefined }; },
    1(r, msg) { msg.name = r.string(); },
    2(r, msg) { msg.decltype = r.string(); },
};
const Value = {
    default() { return undefined; },
    1(r) { return null; },
    2(r) { return r.sint64(); },
    3(r) { return r.double(); },
    4(r) { return r.string(); },
    5(r) { return r.bytes(); },
};

const ServerMsg = {
    default() { return { type: "none" }; },
    1(r) { return { type: "hello_ok" }; },
    2(r) { return r.message(HelloErrorMsg); },
    3(r) { return r.message(ResponseOkMsg); },
    4(r) { return r.message(ResponseErrorMsg); },
};
const HelloErrorMsg = {
    default() { return { type: "hello_error", error: Error$1.default() }; },
    1(r, msg) { msg.error = r.message(Error$1); },
};
const ResponseErrorMsg = {
    default() { return { type: "response_error", requestId: 0, error: Error$1.default() }; },
    1(r, msg) { msg.requestId = r.int32(); },
    2(r, msg) { msg.error = r.message(Error$1); },
};
const ResponseOkMsg = {
    default() {
        return {
            type: "response_ok",
            requestId: 0,
            response: { type: "none" },
        };
    },
    1(r, msg) { msg.requestId = r.int32(); },
    2(r, msg) { msg.response = { type: "open_stream" }; },
    3(r, msg) { msg.response = { type: "close_stream" }; },
    4(r, msg) { msg.response = r.message(ExecuteResp); },
    5(r, msg) { msg.response = r.message(BatchResp); },
    6(r, msg) { msg.response = { type: "open_cursor" }; },
    7(r, msg) { msg.response = { type: "close_cursor" }; },
    8(r, msg) { msg.response = r.message(FetchCursorResp); },
    9(r, msg) { msg.response = { type: "sequence" }; },
    10(r, msg) { msg.response = r.message(DescribeResp); },
    11(r, msg) { msg.response = { type: "store_sql" }; },
    12(r, msg) { msg.response = { type: "close_sql" }; },
    13(r, msg) { msg.response = r.message(GetAutocommitResp); },
};
const ExecuteResp = {
    default() { return { type: "execute", result: StmtResult.default() }; },
    1(r, msg) { msg.result = r.message(StmtResult); },
};
const BatchResp = {
    default() { return { type: "batch", result: BatchResult.default() }; },
    1(r, msg) { msg.result = r.message(BatchResult); },
};
const FetchCursorResp = {
    default() { return { type: "fetch_cursor", entries: [], done: false }; },
    1(r, msg) { msg.entries.push(r.message(CursorEntry)); },
    2(r, msg) { msg.done = r.bool(); },
};
const DescribeResp = {
    default() { return { type: "describe", result: DescribeResult.default() }; },
    1(r, msg) { msg.result = r.message(DescribeResult); },
};
const GetAutocommitResp = {
    default() { return { type: "get_autocommit", isAutocommit: false }; },
    1(r, msg) { msg.isAutocommit = r.bool(); },
};

const subprotocolsV2 = new Map([
    ["hrana2", { version: 2, encoding: "json" }],
    ["hrana1", { version: 1, encoding: "json" }],
]);
const subprotocolsV3 = new Map([
    ["hrana3-protobuf", { version: 3, encoding: "protobuf" }],
    ["hrana3", { version: 3, encoding: "json" }],
    ["hrana2", { version: 2, encoding: "json" }],
    ["hrana1", { version: 1, encoding: "json" }],
]);
/** A client for the Hrana protocol over a WebSocket. */
let WsClient$1 = class WsClient extends Client {
    #socket;
    // List of callbacks that we queue until the socket transitions from the CONNECTING to the OPEN state.
    #openCallbacks;
    // Have we already transitioned from CONNECTING to OPEN and fired the callbacks in #openCallbacks?
    #opened;
    // Stores the error that caused us to close the client (and the socket). If we are not closed, this is
    // `undefined`.
    #closed;
    // Have we received a response to our "hello" from the server?
    #recvdHello;
    // Subprotocol negotiated with the server. It is only available after the socket transitions to the OPEN
    // state.
    #subprotocol;
    // Has the `getVersion()` function been called? This is only used to validate that the API is used
    // correctly.
    #getVersionCalled;
    // A map from request id to the responses that we expect to receive from the server.
    #responseMap;
    // An allocator of request ids.
    #requestIdAlloc;
    // An allocator of stream ids.
    /** @private */
    _streamIdAlloc;
    // An allocator of cursor ids.
    /** @private */
    _cursorIdAlloc;
    // An allocator of SQL text ids.
    #sqlIdAlloc;
    /** @private */
    constructor(socket, jwt) {
        super();
        this.#socket = socket;
        this.#openCallbacks = [];
        this.#opened = false;
        this.#closed = undefined;
        this.#recvdHello = false;
        this.#subprotocol = undefined;
        this.#getVersionCalled = false;
        this.#responseMap = new Map();
        this.#requestIdAlloc = new IdAlloc();
        this._streamIdAlloc = new IdAlloc();
        this._cursorIdAlloc = new IdAlloc();
        this.#sqlIdAlloc = new IdAlloc();
        this.#socket.binaryType = "arraybuffer";
        this.#socket.addEventListener("open", () => this.#onSocketOpen());
        this.#socket.addEventListener("close", (event) => this.#onSocketClose(event));
        this.#socket.addEventListener("error", (event) => this.#onSocketError(event));
        this.#socket.addEventListener("message", (event) => this.#onSocketMessage(event));
        this.#send({ type: "hello", jwt });
    }
    // Send (or enqueue to send) a message to the server.
    #send(msg) {
        if (this.#closed !== undefined) {
            throw new InternalError("Trying to send a message on a closed client");
        }
        if (this.#opened) {
            this.#sendToSocket(msg);
        }
        else {
            const openCallback = () => this.#sendToSocket(msg);
            const errorCallback = () => undefined;
            this.#openCallbacks.push({ openCallback, errorCallback });
        }
    }
    // The socket transitioned from CONNECTING to OPEN
    #onSocketOpen() {
        const protocol = this.#socket.protocol;
        if (protocol === undefined) {
            this.#setClosed(new ClientError("The `WebSocket.protocol` property is undefined. This most likely means that the WebSocket " +
                "implementation provided by the environment is broken. If you are using Miniflare 2, " +
                "please update to Miniflare 3, which fixes this problem."));
            return;
        }
        else if (protocol === "") {
            this.#subprotocol = { version: 1, encoding: "json" };
        }
        else {
            this.#subprotocol = subprotocolsV3.get(protocol);
            if (this.#subprotocol === undefined) {
                this.#setClosed(new ProtoError(`Unrecognized WebSocket subprotocol: ${JSON.stringify(protocol)}`));
                return;
            }
        }
        for (const callbacks of this.#openCallbacks) {
            callbacks.openCallback();
        }
        this.#openCallbacks.length = 0;
        this.#opened = true;
    }
    #sendToSocket(msg) {
        const encoding = this.#subprotocol.encoding;
        if (encoding === "json") {
            const jsonMsg = writeJsonObject(msg, ClientMsg$1);
            this.#socket.send(jsonMsg);
        }
        else if (encoding === "protobuf") {
            const protobufMsg = writeProtobufMessage(msg, ClientMsg);
            this.#socket.send(protobufMsg);
        }
        else {
            throw impossible(encoding, "Impossible encoding");
        }
    }
    /** Get the protocol version negotiated with the server, possibly waiting until the socket is open. */
    getVersion() {
        return new Promise((versionCallback, errorCallback) => {
            this.#getVersionCalled = true;
            if (this.#closed !== undefined) {
                errorCallback(this.#closed);
            }
            else if (!this.#opened) {
                const openCallback = () => versionCallback(this.#subprotocol.version);
                this.#openCallbacks.push({ openCallback, errorCallback });
            }
            else {
                versionCallback(this.#subprotocol.version);
            }
        });
    }
    // Make sure that the negotiated version is at least `minVersion`.
    /** @private */
    _ensureVersion(minVersion, feature) {
        if (this.#subprotocol === undefined || !this.#getVersionCalled) {
            throw new ProtocolVersionError(`${feature} is supported only on protocol version ${minVersion} and higher, ` +
                "but the version supported by the WebSocket server is not yet known. " +
                "Use Client.getVersion() to wait until the version is available.");
        }
        else if (this.#subprotocol.version < minVersion) {
            throw new ProtocolVersionError(`${feature} is supported on protocol version ${minVersion} and higher, ` +
                `but the WebSocket server only supports version ${this.#subprotocol.version}`);
        }
    }
    // Send a request to the server and invoke a callback when we get the response.
    /** @private */
    _sendRequest(request, callbacks) {
        if (this.#closed !== undefined) {
            callbacks.errorCallback(new ClosedError("Client is closed", this.#closed));
            return;
        }
        const requestId = this.#requestIdAlloc.alloc();
        this.#responseMap.set(requestId, { ...callbacks, type: request.type });
        this.#send({ type: "request", requestId, request });
    }
    // The socket encountered an error.
    #onSocketError(event) {
        const eventMessage = event.message;
        const message = eventMessage ?? "WebSocket was closed due to an error";
        this.#setClosed(new WebSocketError(message));
    }
    // The socket was closed.
    #onSocketClose(event) {
        let message = `WebSocket was closed with code ${event.code}`;
        if (event.reason) {
            message += `: ${event.reason}`;
        }
        this.#setClosed(new WebSocketError(message));
    }
    // Close the client with the given error.
    #setClosed(error) {
        if (this.#closed !== undefined) {
            return;
        }
        this.#closed = error;
        for (const callbacks of this.#openCallbacks) {
            callbacks.errorCallback(error);
        }
        this.#openCallbacks.length = 0;
        for (const [requestId, responseState] of this.#responseMap.entries()) {
            responseState.errorCallback(error);
            this.#requestIdAlloc.free(requestId);
        }
        this.#responseMap.clear();
        this.#socket.close();
    }
    // We received a message from the socket.
    #onSocketMessage(event) {
        if (this.#closed !== undefined) {
            return;
        }
        try {
            let msg;
            const encoding = this.#subprotocol.encoding;
            if (encoding === "json") {
                if (typeof event.data !== "string") {
                    this.#socket.close(3003, "Only text messages are accepted with JSON encoding");
                    this.#setClosed(new ProtoError("Received non-text message from server with JSON encoding"));
                    return;
                }
                msg = readJsonObject(JSON.parse(event.data), ServerMsg$1);
            }
            else if (encoding === "protobuf") {
                if (!(event.data instanceof ArrayBuffer)) {
                    this.#socket.close(3003, "Only binary messages are accepted with Protobuf encoding");
                    this.#setClosed(new ProtoError("Received non-binary message from server with Protobuf encoding"));
                    return;
                }
                msg = readProtobufMessage(new Uint8Array(event.data), ServerMsg);
            }
            else {
                throw impossible(encoding, "Impossible encoding");
            }
            this.#handleMsg(msg);
        }
        catch (e) {
            this.#socket.close(3007, "Could not handle message");
            this.#setClosed(e);
        }
    }
    // Handle a message from the server.
    #handleMsg(msg) {
        if (msg.type === "none") {
            throw new ProtoError("Received an unrecognized ServerMsg");
        }
        else if (msg.type === "hello_ok" || msg.type === "hello_error") {
            if (this.#recvdHello) {
                throw new ProtoError("Received a duplicated hello response");
            }
            this.#recvdHello = true;
            if (msg.type === "hello_error") {
                throw errorFromProto(msg.error);
            }
            return;
        }
        else if (!this.#recvdHello) {
            throw new ProtoError("Received a non-hello message before a hello response");
        }
        if (msg.type === "response_ok") {
            const requestId = msg.requestId;
            const responseState = this.#responseMap.get(requestId);
            this.#responseMap.delete(requestId);
            if (responseState === undefined) {
                throw new ProtoError("Received unexpected OK response");
            }
            this.#requestIdAlloc.free(requestId);
            try {
                if (responseState.type !== msg.response.type) {
                    console.dir({ responseState, msg });
                    throw new ProtoError("Received unexpected type of response");
                }
                responseState.responseCallback(msg.response);
            }
            catch (e) {
                responseState.errorCallback(e);
                throw e;
            }
        }
        else if (msg.type === "response_error") {
            const requestId = msg.requestId;
            const responseState = this.#responseMap.get(requestId);
            this.#responseMap.delete(requestId);
            if (responseState === undefined) {
                throw new ProtoError("Received unexpected error response");
            }
            this.#requestIdAlloc.free(requestId);
            responseState.errorCallback(errorFromProto(msg.error));
        }
        else {
            throw impossible(msg, "Impossible ServerMsg type");
        }
    }
    /** Open a {@link WsStream}, a stream for executing SQL statements. */
    openStream() {
        return WsStream.open(this);
    }
    /** Cache a SQL text on the server. This requires protocol version 2 or higher. */
    storeSql(sql) {
        this._ensureVersion(2, "storeSql()");
        const sqlId = this.#sqlIdAlloc.alloc();
        const sqlObj = new Sql(this, sqlId);
        const responseCallback = () => undefined;
        const errorCallback = (e) => sqlObj._setClosed(e);
        const request = { type: "store_sql", sqlId, sql };
        this._sendRequest(request, { responseCallback, errorCallback });
        return sqlObj;
    }
    /** @private */
    _closeSql(sqlId) {
        if (this.#closed !== undefined) {
            return;
        }
        const responseCallback = () => this.#sqlIdAlloc.free(sqlId);
        const errorCallback = (e) => this.#setClosed(e);
        const request = { type: "close_sql", sqlId };
        this._sendRequest(request, { responseCallback, errorCallback });
    }
    /** Close the client and the WebSocket. */
    close() {
        this.#setClosed(new ClientError("Client was manually closed"));
    }
    /** True if the client is closed. */
    get closed() {
        return this.#closed !== undefined;
    }
};

const _fetch = fetch;
const _Request = Request;
const _Headers = Headers;

// queueMicrotask() ponyfill
// https://github.com/libsql/libsql-client-ts/issues/47
let _queueMicrotask;
if (typeof queueMicrotask !== "undefined") {
    _queueMicrotask = queueMicrotask;
}
else {
    const resolved = Promise.resolve();
    _queueMicrotask = (callback) => {
        resolved.then(callback);
    };
}

class ByteQueue {
    #array;
    #shiftPos;
    #pushPos;
    constructor(initialCap) {
        this.#array = new Uint8Array(new ArrayBuffer(initialCap));
        this.#shiftPos = 0;
        this.#pushPos = 0;
    }
    get length() {
        return this.#pushPos - this.#shiftPos;
    }
    data() {
        return this.#array.slice(this.#shiftPos, this.#pushPos);
    }
    push(chunk) {
        this.#ensurePush(chunk.byteLength);
        this.#array.set(chunk, this.#pushPos);
        this.#pushPos += chunk.byteLength;
    }
    #ensurePush(pushLength) {
        if (this.#pushPos + pushLength <= this.#array.byteLength) {
            return;
        }
        const filledLength = this.#pushPos - this.#shiftPos;
        if (filledLength + pushLength <= this.#array.byteLength &&
            2 * this.#pushPos >= this.#array.byteLength) {
            this.#array.copyWithin(0, this.#shiftPos, this.#pushPos);
        }
        else {
            let newCap = this.#array.byteLength;
            do {
                newCap *= 2;
            } while (filledLength + pushLength > newCap);
            const newArray = new Uint8Array(new ArrayBuffer(newCap));
            newArray.set(this.#array.slice(this.#shiftPos, this.#pushPos), 0);
            this.#array = newArray;
        }
        this.#pushPos = filledLength;
        this.#shiftPos = 0;
    }
    shift(length) {
        this.#shiftPos += length;
    }
}

function PipelineRespBody$1(obj) {
    const baton = stringOpt(obj["baton"]);
    const baseUrl = stringOpt(obj["base_url"]);
    const results = arrayObjectsMap(obj["results"], StreamResult$1);
    return { baton, baseUrl, results };
}
function StreamResult$1(obj) {
    const type = string(obj["type"]);
    if (type === "ok") {
        const response = StreamResponse$1(object(obj["response"]));
        return { type: "ok", response };
    }
    else if (type === "error") {
        const error = Error$2(object(obj["error"]));
        return { type: "error", error };
    }
    else {
        throw new ProtoError("Unexpected type of StreamResult");
    }
}
function StreamResponse$1(obj) {
    const type = string(obj["type"]);
    if (type === "close") {
        return { type: "close" };
    }
    else if (type === "execute") {
        const result = StmtResult$1(object(obj["result"]));
        return { type: "execute", result };
    }
    else if (type === "batch") {
        const result = BatchResult$1(object(obj["result"]));
        return { type: "batch", result };
    }
    else if (type === "sequence") {
        return { type: "sequence" };
    }
    else if (type === "describe") {
        const result = DescribeResult$1(object(obj["result"]));
        return { type: "describe", result };
    }
    else if (type === "store_sql") {
        return { type: "store_sql" };
    }
    else if (type === "close_sql") {
        return { type: "close_sql" };
    }
    else if (type === "get_autocommit") {
        const isAutocommit = boolean(obj["is_autocommit"]);
        return { type: "get_autocommit", isAutocommit };
    }
    else {
        throw new ProtoError("Unexpected type of StreamResponse");
    }
}
function CursorRespBody$1(obj) {
    const baton = stringOpt(obj["baton"]);
    const baseUrl = stringOpt(obj["base_url"]);
    return { baton, baseUrl };
}

const PipelineRespBody = {
    default() { return { baton: undefined, baseUrl: undefined, results: [] }; },
    1(r, msg) { msg.baton = r.string(); },
    2(r, msg) { msg.baseUrl = r.string(); },
    3(r, msg) { msg.results.push(r.message(StreamResult)); },
};
const StreamResult = {
    default() { return { type: "none" }; },
    1(r) { return { type: "ok", response: r.message(StreamResponse) }; },
    2(r) { return { type: "error", error: r.message(Error$1) }; },
};
const StreamResponse = {
    default() { return { type: "none" }; },
    1(r) { return { type: "close" }; },
    2(r) { return r.message(ExecuteStreamResp); },
    3(r) { return r.message(BatchStreamResp); },
    4(r) { return { type: "sequence" }; },
    5(r) { return r.message(DescribeStreamResp); },
    6(r) { return { type: "store_sql" }; },
    7(r) { return { type: "close_sql" }; },
    8(r) { return r.message(GetAutocommitStreamResp); },
};
const ExecuteStreamResp = {
    default() { return { type: "execute", result: StmtResult.default() }; },
    1(r, msg) { msg.result = r.message(StmtResult); },
};
const BatchStreamResp = {
    default() { return { type: "batch", result: BatchResult.default() }; },
    1(r, msg) { msg.result = r.message(BatchResult); },
};
const DescribeStreamResp = {
    default() { return { type: "describe", result: DescribeResult.default() }; },
    1(r, msg) { msg.result = r.message(DescribeResult); },
};
const GetAutocommitStreamResp = {
    default() { return { type: "get_autocommit", isAutocommit: false }; },
    1(r, msg) { msg.isAutocommit = r.bool(); },
};
const CursorRespBody = {
    default() { return { baton: undefined, baseUrl: undefined }; },
    1(r, msg) { msg.baton = r.string(); },
    2(r, msg) { msg.baseUrl = r.string(); },
};

class HttpCursor extends Cursor {
    #stream;
    #encoding;
    #reader;
    #queue;
    #closed;
    #done;
    /** @private */
    constructor(stream, encoding) {
        super();
        this.#stream = stream;
        this.#encoding = encoding;
        this.#reader = undefined;
        this.#queue = new ByteQueue(16 * 1024);
        this.#closed = undefined;
        this.#done = false;
    }
    async open(response) {
        if (response.body === null) {
            throw new ProtoError("No response body for cursor request");
        }
        this.#reader = response.body.getReader();
        const respBody = await this.#nextItem(CursorRespBody$1, CursorRespBody);
        if (respBody === undefined) {
            throw new ProtoError("Empty response to cursor request");
        }
        return respBody;
    }
    /** Fetch the next entry from the cursor. */
    next() {
        return this.#nextItem(CursorEntry$1, CursorEntry);
    }
    /** Close the cursor. */
    close() {
        this._setClosed(new ClientError("Cursor was manually closed"));
    }
    /** @private */
    _setClosed(error) {
        if (this.#closed !== undefined) {
            return;
        }
        this.#closed = error;
        this.#stream._cursorClosed(this);
        if (this.#reader !== undefined) {
            this.#reader.cancel();
        }
    }
    /** True if the cursor is closed. */
    get closed() {
        return this.#closed !== undefined;
    }
    async #nextItem(jsonFun, protobufDef) {
        for (;;) {
            if (this.#done) {
                return undefined;
            }
            else if (this.#closed !== undefined) {
                throw new ClosedError("Cursor is closed", this.#closed);
            }
            if (this.#encoding === "json") {
                const jsonData = this.#parseItemJson();
                if (jsonData !== undefined) {
                    const jsonText = new TextDecoder().decode(jsonData);
                    const jsonValue = JSON.parse(jsonText);
                    return readJsonObject(jsonValue, jsonFun);
                }
            }
            else if (this.#encoding === "protobuf") {
                const protobufData = this.#parseItemProtobuf();
                if (protobufData !== undefined) {
                    return readProtobufMessage(protobufData, protobufDef);
                }
            }
            else {
                throw impossible(this.#encoding, "Impossible encoding");
            }
            if (this.#reader === undefined) {
                throw new InternalError("Attempted to read from HTTP cursor before it was opened");
            }
            const { value, done } = await this.#reader.read();
            if (done && this.#queue.length === 0) {
                this.#done = true;
            }
            else if (done) {
                throw new ProtoError("Unexpected end of cursor stream");
            }
            else {
                this.#queue.push(value);
            }
        }
    }
    #parseItemJson() {
        const data = this.#queue.data();
        const newlineByte = 10;
        const newlinePos = data.indexOf(newlineByte);
        if (newlinePos < 0) {
            return undefined;
        }
        const jsonData = data.slice(0, newlinePos);
        this.#queue.shift(newlinePos + 1);
        return jsonData;
    }
    #parseItemProtobuf() {
        const data = this.#queue.data();
        let varintValue = 0;
        let varintLength = 0;
        for (;;) {
            if (varintLength >= data.byteLength) {
                return undefined;
            }
            const byte = data[varintLength];
            varintValue |= (byte & 0x7f) << (7 * varintLength);
            varintLength += 1;
            if (!(byte & 0x80)) {
                break;
            }
        }
        if (data.byteLength < varintLength + varintValue) {
            return undefined;
        }
        const protobufData = data.slice(varintLength, varintLength + varintValue);
        this.#queue.shift(varintLength + varintValue);
        return protobufData;
    }
}

function PipelineReqBody$1(w, msg) {
    if (msg.baton !== undefined) {
        w.string("baton", msg.baton);
    }
    w.arrayObjects("requests", msg.requests, StreamRequest$1);
}
function StreamRequest$1(w, msg) {
    w.stringRaw("type", msg.type);
    if (msg.type === "close") ;
    else if (msg.type === "execute") {
        w.object("stmt", msg.stmt, Stmt$1);
    }
    else if (msg.type === "batch") {
        w.object("batch", msg.batch, Batch$1);
    }
    else if (msg.type === "sequence") {
        if (msg.sql !== undefined) {
            w.string("sql", msg.sql);
        }
        if (msg.sqlId !== undefined) {
            w.number("sql_id", msg.sqlId);
        }
    }
    else if (msg.type === "describe") {
        if (msg.sql !== undefined) {
            w.string("sql", msg.sql);
        }
        if (msg.sqlId !== undefined) {
            w.number("sql_id", msg.sqlId);
        }
    }
    else if (msg.type === "store_sql") {
        w.number("sql_id", msg.sqlId);
        w.string("sql", msg.sql);
    }
    else if (msg.type === "close_sql") {
        w.number("sql_id", msg.sqlId);
    }
    else if (msg.type === "get_autocommit") ;
    else {
        throw impossible(msg, "Impossible type of StreamRequest");
    }
}
function CursorReqBody$1(w, msg) {
    if (msg.baton !== undefined) {
        w.string("baton", msg.baton);
    }
    w.object("batch", msg.batch, Batch$1);
}

function PipelineReqBody(w, msg) {
    if (msg.baton !== undefined) {
        w.string(1, msg.baton);
    }
    for (const req of msg.requests) {
        w.message(2, req, StreamRequest);
    }
}
function StreamRequest(w, msg) {
    if (msg.type === "close") {
        w.message(1, msg, CloseStreamReq);
    }
    else if (msg.type === "execute") {
        w.message(2, msg, ExecuteStreamReq);
    }
    else if (msg.type === "batch") {
        w.message(3, msg, BatchStreamReq);
    }
    else if (msg.type === "sequence") {
        w.message(4, msg, SequenceStreamReq);
    }
    else if (msg.type === "describe") {
        w.message(5, msg, DescribeStreamReq);
    }
    else if (msg.type === "store_sql") {
        w.message(6, msg, StoreSqlStreamReq);
    }
    else if (msg.type === "close_sql") {
        w.message(7, msg, CloseSqlStreamReq);
    }
    else if (msg.type === "get_autocommit") {
        w.message(8, msg, GetAutocommitStreamReq);
    }
    else {
        throw impossible(msg, "Impossible type of StreamRequest");
    }
}
function CloseStreamReq(_w, _msg) {
}
function ExecuteStreamReq(w, msg) {
    w.message(1, msg.stmt, Stmt);
}
function BatchStreamReq(w, msg) {
    w.message(1, msg.batch, Batch);
}
function SequenceStreamReq(w, msg) {
    if (msg.sql !== undefined) {
        w.string(1, msg.sql);
    }
    if (msg.sqlId !== undefined) {
        w.int32(2, msg.sqlId);
    }
}
function DescribeStreamReq(w, msg) {
    if (msg.sql !== undefined) {
        w.string(1, msg.sql);
    }
    if (msg.sqlId !== undefined) {
        w.int32(2, msg.sqlId);
    }
}
function StoreSqlStreamReq(w, msg) {
    w.int32(1, msg.sqlId);
    w.string(2, msg.sql);
}
function CloseSqlStreamReq(w, msg) {
    w.int32(1, msg.sqlId);
}
function GetAutocommitStreamReq(_w, _msg) {
}
function CursorReqBody(w, msg) {
    if (msg.baton !== undefined) {
        w.string(1, msg.baton);
    }
    w.message(2, msg.batch, Batch);
}

class HttpStream extends Stream {
    #client;
    #baseUrl;
    #jwt;
    #fetch;
    #baton;
    #queue;
    #flushing;
    #cursor;
    #closing;
    #closeQueued;
    #closed;
    #sqlIdAlloc;
    /** @private */
    constructor(client, baseUrl, jwt, customFetch) {
        super(client.intMode);
        this.#client = client;
        this.#baseUrl = baseUrl.toString();
        this.#jwt = jwt;
        this.#fetch = customFetch;
        this.#baton = undefined;
        this.#queue = new Queue();
        this.#flushing = false;
        this.#closing = false;
        this.#closeQueued = false;
        this.#closed = undefined;
        this.#sqlIdAlloc = new IdAlloc();
    }
    /** Get the {@link HttpClient} object that this stream belongs to. */
    client() {
        return this.#client;
    }
    /** @private */
    _sqlOwner() {
        return this;
    }
    /** Cache a SQL text on the server. */
    storeSql(sql) {
        const sqlId = this.#sqlIdAlloc.alloc();
        this.#sendStreamRequest({ type: "store_sql", sqlId, sql }).then(() => undefined, (error) => this._setClosed(error));
        return new Sql(this, sqlId);
    }
    /** @private */
    _closeSql(sqlId) {
        if (this.#closed !== undefined) {
            return;
        }
        this.#sendStreamRequest({ type: "close_sql", sqlId }).then(() => this.#sqlIdAlloc.free(sqlId), (error) => this._setClosed(error));
    }
    /** @private */
    _execute(stmt) {
        return this.#sendStreamRequest({ type: "execute", stmt }).then((response) => {
            return response.result;
        });
    }
    /** @private */
    _batch(batch) {
        return this.#sendStreamRequest({ type: "batch", batch }).then((response) => {
            return response.result;
        });
    }
    /** @private */
    _describe(protoSql) {
        return this.#sendStreamRequest({
            type: "describe",
            sql: protoSql.sql,
            sqlId: protoSql.sqlId
        }).then((response) => {
            return response.result;
        });
    }
    /** @private */
    _sequence(protoSql) {
        return this.#sendStreamRequest({
            type: "sequence",
            sql: protoSql.sql,
            sqlId: protoSql.sqlId,
        }).then((_response) => {
            return undefined;
        });
    }
    /** Check whether the SQL connection underlying this stream is in autocommit state (i.e., outside of an
     * explicit transaction). This requires protocol version 3 or higher.
     */
    getAutocommit() {
        this.#client._ensureVersion(3, "getAutocommit()");
        return this.#sendStreamRequest({
            type: "get_autocommit",
        }).then((response) => {
            return response.isAutocommit;
        });
    }
    #sendStreamRequest(request) {
        return new Promise((responseCallback, errorCallback) => {
            this.#pushToQueue({ type: "pipeline", request, responseCallback, errorCallback });
        });
    }
    /** @private */
    _openCursor(batch) {
        return new Promise((cursorCallback, errorCallback) => {
            this.#pushToQueue({ type: "cursor", batch, cursorCallback, errorCallback });
        });
    }
    /** @private */
    _cursorClosed(cursor) {
        if (cursor !== this.#cursor) {
            throw new InternalError("Cursor was closed, but it was not associated with the stream");
        }
        this.#cursor = undefined;
        _queueMicrotask(() => this.#flushQueue());
    }
    /** Immediately close the stream. */
    close() {
        this._setClosed(new ClientError("Stream was manually closed"));
    }
    /** Gracefully close the stream. */
    closeGracefully() {
        this.#closing = true;
        _queueMicrotask(() => this.#flushQueue());
    }
    /** True if the stream is closed. */
    get closed() {
        return this.#closed !== undefined || this.#closing;
    }
    /** @private */
    _setClosed(error) {
        if (this.#closed !== undefined) {
            return;
        }
        this.#closed = error;
        if (this.#cursor !== undefined) {
            this.#cursor._setClosed(error);
        }
        this.#client._streamClosed(this);
        for (;;) {
            const entry = this.#queue.shift();
            if (entry !== undefined) {
                entry.errorCallback(error);
            }
            else {
                break;
            }
        }
        if ((this.#baton !== undefined || this.#flushing) && !this.#closeQueued) {
            this.#queue.push({
                type: "pipeline",
                request: { type: "close" },
                responseCallback: () => undefined,
                errorCallback: () => undefined,
            });
            this.#closeQueued = true;
            _queueMicrotask(() => this.#flushQueue());
        }
    }
    #pushToQueue(entry) {
        if (this.#closed !== undefined) {
            throw new ClosedError("Stream is closed", this.#closed);
        }
        else if (this.#closing) {
            throw new ClosedError("Stream is closing", undefined);
        }
        else {
            this.#queue.push(entry);
            _queueMicrotask(() => this.#flushQueue());
        }
    }
    #flushQueue() {
        if (this.#flushing || this.#cursor !== undefined) {
            return;
        }
        if (this.#closing && this.#queue.length === 0) {
            this._setClosed(new ClientError("Stream was gracefully closed"));
            return;
        }
        const endpoint = this.#client._endpoint;
        if (endpoint === undefined) {
            this.#client._endpointPromise.then(() => this.#flushQueue(), (error) => this._setClosed(error));
            return;
        }
        const firstEntry = this.#queue.shift();
        if (firstEntry === undefined) {
            return;
        }
        else if (firstEntry.type === "pipeline") {
            const pipeline = [firstEntry];
            for (;;) {
                const entry = this.#queue.first();
                if (entry !== undefined && entry.type === "pipeline") {
                    pipeline.push(entry);
                    this.#queue.shift();
                }
                else if (entry === undefined && this.#closing && !this.#closeQueued) {
                    pipeline.push({
                        type: "pipeline",
                        request: { type: "close" },
                        responseCallback: () => undefined,
                        errorCallback: () => undefined,
                    });
                    this.#closeQueued = true;
                    break;
                }
                else {
                    break;
                }
            }
            this.#flushPipeline(endpoint, pipeline);
        }
        else if (firstEntry.type === "cursor") {
            this.#flushCursor(endpoint, firstEntry);
        }
        else {
            throw impossible(firstEntry, "Impossible type of QueueEntry");
        }
    }
    #flushPipeline(endpoint, pipeline) {
        this.#flush(() => this.#createPipelineRequest(pipeline, endpoint), (resp) => decodePipelineResponse(resp, endpoint.encoding), (respBody) => respBody.baton, (respBody) => respBody.baseUrl, (respBody) => handlePipelineResponse(pipeline, respBody), (error) => pipeline.forEach((entry) => entry.errorCallback(error)));
    }
    #flushCursor(endpoint, entry) {
        const cursor = new HttpCursor(this, endpoint.encoding);
        this.#cursor = cursor;
        this.#flush(() => this.#createCursorRequest(entry, endpoint), (resp) => cursor.open(resp), (respBody) => respBody.baton, (respBody) => respBody.baseUrl, (_respBody) => entry.cursorCallback(cursor), (error) => entry.errorCallback(error));
    }
    #flush(createRequest, decodeResponse, getBaton, getBaseUrl, handleResponse, handleError) {
        let promise;
        try {
            const request = createRequest();
            const fetch = this.#fetch;
            promise = fetch(request);
        }
        catch (error) {
            promise = Promise.reject(error);
        }
        this.#flushing = true;
        promise.then((resp) => {
            if (!resp.ok) {
                return errorFromResponse(resp).then((error) => {
                    throw error;
                });
            }
            return decodeResponse(resp);
        }).then((r) => {
            this.#baton = getBaton(r);
            this.#baseUrl = getBaseUrl(r) ?? this.#baseUrl;
            handleResponse(r);
        }).catch((error) => {
            this._setClosed(error);
            handleError(error);
        }).finally(() => {
            this.#flushing = false;
            this.#flushQueue();
        });
    }
    #createPipelineRequest(pipeline, endpoint) {
        return this.#createRequest(new URL(endpoint.pipelinePath, this.#baseUrl), {
            baton: this.#baton,
            requests: pipeline.map((entry) => entry.request),
        }, endpoint.encoding, PipelineReqBody$1, PipelineReqBody);
    }
    #createCursorRequest(entry, endpoint) {
        if (endpoint.cursorPath === undefined) {
            throw new ProtocolVersionError("Cursors are supported only on protocol version 3 and higher, " +
                `but the HTTP server only supports version ${endpoint.version}.`);
        }
        return this.#createRequest(new URL(endpoint.cursorPath, this.#baseUrl), {
            baton: this.#baton,
            batch: entry.batch,
        }, endpoint.encoding, CursorReqBody$1, CursorReqBody);
    }
    #createRequest(url, reqBody, encoding, jsonFun, protobufFun) {
        let bodyData;
        let contentType;
        if (encoding === "json") {
            bodyData = writeJsonObject(reqBody, jsonFun);
            contentType = "application/json";
        }
        else if (encoding === "protobuf") {
            bodyData = writeProtobufMessage(reqBody, protobufFun);
            contentType = "application/x-protobuf";
        }
        else {
            throw impossible(encoding, "Impossible encoding");
        }
        const headers = new _Headers();
        headers.set("content-type", contentType);
        if (this.#jwt !== undefined) {
            headers.set("authorization", `Bearer ${this.#jwt}`);
        }
        return new _Request(url.toString(), { method: "POST", headers, body: bodyData });
    }
}
function handlePipelineResponse(pipeline, respBody) {
    if (respBody.results.length !== pipeline.length) {
        throw new ProtoError("Server returned unexpected number of pipeline results");
    }
    for (let i = 0; i < pipeline.length; ++i) {
        const result = respBody.results[i];
        const entry = pipeline[i];
        if (result.type === "ok") {
            if (result.response.type !== entry.request.type) {
                throw new ProtoError("Received unexpected type of response");
            }
            entry.responseCallback(result.response);
        }
        else if (result.type === "error") {
            entry.errorCallback(errorFromProto(result.error));
        }
        else if (result.type === "none") {
            throw new ProtoError("Received unrecognized type of StreamResult");
        }
        else {
            throw impossible(result, "Received impossible type of StreamResult");
        }
    }
}
async function decodePipelineResponse(resp, encoding) {
    if (encoding === "json") {
        const respJson = await resp.json();
        return readJsonObject(respJson, PipelineRespBody$1);
    }
    if (encoding === "protobuf") {
        const respData = await resp.arrayBuffer();
        return readProtobufMessage(new Uint8Array(respData), PipelineRespBody);
    }
    await resp.body?.cancel();
    throw impossible(encoding, "Impossible encoding");
}
async function errorFromResponse(resp) {
    const respType = resp.headers.get("content-type") ?? "text/plain";
    let message = `Server returned HTTP status ${resp.status}`;
    if (respType === "application/json") {
        const respBody = await resp.json();
        if ("message" in respBody) {
            return errorFromProto(respBody);
        }
        return new HttpServerError(message, resp.status);
    }
    if (respType === "text/plain") {
        const respBody = (await resp.text()).trim();
        if (respBody !== "") {
            message += `: ${respBody}`;
        }
        return new HttpServerError(message, resp.status);
    }
    await resp.body?.cancel();
    return new HttpServerError(message, resp.status);
}

const checkEndpoints = [
    {
        versionPath: "v3-protobuf",
        pipelinePath: "v3-protobuf/pipeline",
        cursorPath: "v3-protobuf/cursor",
        version: 3,
        encoding: "protobuf",
    },
    /*
    {
        versionPath: "v3",
        pipelinePath: "v3/pipeline",
        cursorPath: "v3/cursor",
        version: 3,
        encoding: "json",
    },
    */
];
const fallbackEndpoint = {
    versionPath: "v2",
    pipelinePath: "v2/pipeline",
    cursorPath: undefined,
    version: 2,
    encoding: "json",
};
/** A client for the Hrana protocol over HTTP. */
let HttpClient$1 = class HttpClient extends Client {
    #url;
    #jwt;
    #fetch;
    #closed;
    #streams;
    /** @private */
    _endpointPromise;
    /** @private */
    _endpoint;
    /** @private */
    constructor(url, jwt, customFetch, protocolVersion = 2) {
        super();
        this.#url = url;
        this.#jwt = jwt;
        this.#fetch = customFetch ?? _fetch;
        this.#closed = undefined;
        this.#streams = new Set();
        if (protocolVersion == 3) {
            this._endpointPromise = findEndpoint(this.#fetch, this.#url);
            this._endpointPromise.then((endpoint) => this._endpoint = endpoint, (error) => this.#setClosed(error));
        }
        else {
            this._endpointPromise = Promise.resolve(fallbackEndpoint);
            this._endpointPromise.then((endpoint) => this._endpoint = endpoint, (error) => this.#setClosed(error));
        }
    }
    /** Get the protocol version supported by the server. */
    async getVersion() {
        if (this._endpoint !== undefined) {
            return this._endpoint.version;
        }
        return (await this._endpointPromise).version;
    }
    // Make sure that the negotiated version is at least `minVersion`.
    /** @private */
    _ensureVersion(minVersion, feature) {
        if (minVersion <= fallbackEndpoint.version) {
            return;
        }
        else if (this._endpoint === undefined) {
            throw new ProtocolVersionError(`${feature} is supported only on protocol version ${minVersion} and higher, ` +
                "but the version supported by the HTTP server is not yet known. " +
                "Use Client.getVersion() to wait until the version is available.");
        }
        else if (this._endpoint.version < minVersion) {
            throw new ProtocolVersionError(`${feature} is supported only on protocol version ${minVersion} and higher, ` +
                `but the HTTP server only supports version ${this._endpoint.version}.`);
        }
    }
    /** Open a {@link HttpStream}, a stream for executing SQL statements. */
    openStream() {
        if (this.#closed !== undefined) {
            throw new ClosedError("Client is closed", this.#closed);
        }
        const stream = new HttpStream(this, this.#url, this.#jwt, this.#fetch);
        this.#streams.add(stream);
        return stream;
    }
    /** @private */
    _streamClosed(stream) {
        this.#streams.delete(stream);
    }
    /** Close the client and all its streams. */
    close() {
        this.#setClosed(new ClientError("Client was manually closed"));
    }
    /** True if the client is closed. */
    get closed() {
        return this.#closed !== undefined;
    }
    #setClosed(error) {
        if (this.#closed !== undefined) {
            return;
        }
        this.#closed = error;
        for (const stream of Array.from(this.#streams)) {
            stream._setClosed(new ClosedError("Client was closed", error));
        }
    }
};
async function findEndpoint(customFetch, clientUrl) {
    const fetch = customFetch;
    for (const endpoint of checkEndpoints) {
        const url = new URL(endpoint.versionPath, clientUrl);
        const request = new _Request(url.toString(), { method: "GET" });
        const response = await fetch(request);
        await response.arrayBuffer();
        if (response.ok) {
            return endpoint;
        }
    }
    return fallbackEndpoint;
}

/** Open a Hrana client over WebSocket connected to the given `url`. */
function openWs(url, jwt, protocolVersion = 2) {
    if (typeof _WebSocket === "undefined") {
        throw new WebSocketUnsupportedError("WebSockets are not supported in this environment");
    }
    var subprotocols = undefined;
    if (protocolVersion == 3) {
        subprotocols = Array.from(subprotocolsV3.keys());
    }
    else {
        subprotocols = Array.from(subprotocolsV2.keys());
    }
    const socket = new _WebSocket(url, subprotocols);
    return new WsClient$1(socket, jwt);
}
/** Open a Hrana client over HTTP connected to the given `url`.
 *
 * If the `customFetch` argument is passed and not `undefined`, it is used in place of the `fetch` function
 * from `@libsql/isomorphic-fetch`. This function is always called with a `Request` object from
 * `@libsql/isomorphic-fetch`.
 */
function openHttp(url, jwt, customFetch, protocolVersion = 2) {
    return new HttpClient$1(url instanceof URL ? url : new URL(url), jwt, customFetch, protocolVersion);
}

class HranaTransaction {
    #mode;
    #version;
    // Promise that is resolved when the BEGIN statement completes, or `undefined` if we haven't executed the
    // BEGIN statement yet.
    #started;
    /** @private */
    constructor(mode, version) {
        this.#mode = mode;
        this.#version = version;
        this.#started = undefined;
    }
    execute(stmt) {
        return this.batch([stmt]).then((results) => results[0]);
    }
    async batch(stmts) {
        const stream = this._getStream();
        if (stream.closed) {
            throw new LibsqlError("Cannot execute statements because the transaction is closed", "TRANSACTION_CLOSED");
        }
        try {
            const hranaStmts = stmts.map(stmtToHrana);
            let rowsPromises;
            if (this.#started === undefined) {
                // The transaction hasn't started yet, so we need to send the BEGIN statement in a batch with
                // `hranaStmts`.
                this._getSqlCache().apply(hranaStmts);
                const batch = stream.batch(this.#version >= 3);
                const beginStep = batch.step();
                const beginPromise = beginStep.run(transactionModeToBegin(this.#mode));
                // Execute the `hranaStmts` only if the BEGIN succeeded, to make sure that we don't execute it
                // outside of a transaction.
                let lastStep = beginStep;
                rowsPromises = hranaStmts.map((hranaStmt) => {
                    const stmtStep = batch
                        .step()
                        .condition(BatchCond$2.ok(lastStep));
                    if (this.#version >= 3) {
                        // If the Hrana version supports it, make sure that we are still in a transaction
                        stmtStep.condition(BatchCond$2.not(BatchCond$2.isAutocommit(batch)));
                    }
                    const rowsPromise = stmtStep.query(hranaStmt);
                    rowsPromise.catch(() => undefined); // silence Node warning
                    lastStep = stmtStep;
                    return rowsPromise;
                });
                // `this.#started` is resolved successfully only if the batch and the BEGIN statement inside
                // of the batch are both successful.
                this.#started = batch
                    .execute()
                    .then(() => beginPromise)
                    .then(() => undefined);
                try {
                    await this.#started;
                }
                catch (e) {
                    // If the BEGIN failed, the transaction is unusable and we must close it. However, if the
                    // BEGIN suceeds and `hranaStmts` fail, the transaction is _not_ closed.
                    this.close();
                    throw e;
                }
            }
            else {
                if (this.#version < 3) {
                    // The transaction has started, so we must wait until the BEGIN statement completed to make
                    // sure that we don't execute `hranaStmts` outside of a transaction.
                    await this.#started;
                }
                else {
                    // The transaction has started, but we will use `hrana.BatchCond.isAutocommit()` to make
                    // sure that we don't execute `hranaStmts` outside of a transaction, so we don't have to
                    // wait for `this.#started`
                }
                this._getSqlCache().apply(hranaStmts);
                const batch = stream.batch(this.#version >= 3);
                let lastStep = undefined;
                rowsPromises = hranaStmts.map((hranaStmt) => {
                    const stmtStep = batch.step();
                    if (lastStep !== undefined) {
                        stmtStep.condition(BatchCond$2.ok(lastStep));
                    }
                    if (this.#version >= 3) {
                        stmtStep.condition(BatchCond$2.not(BatchCond$2.isAutocommit(batch)));
                    }
                    const rowsPromise = stmtStep.query(hranaStmt);
                    rowsPromise.catch(() => undefined); // silence Node warning
                    lastStep = stmtStep;
                    return rowsPromise;
                });
                await batch.execute();
            }
            const resultSets = [];
            for (const rowsPromise of rowsPromises) {
                const rows = await rowsPromise;
                if (rows === undefined) {
                    throw new LibsqlError("Statement in a transaction was not executed, " +
                        "probably because the transaction has been rolled back", "TRANSACTION_CLOSED");
                }
                resultSets.push(resultSetFromHrana(rows));
            }
            return resultSets;
        }
        catch (e) {
            throw mapHranaError(e);
        }
    }
    async executeMultiple(sql) {
        const stream = this._getStream();
        if (stream.closed) {
            throw new LibsqlError("Cannot execute statements because the transaction is closed", "TRANSACTION_CLOSED");
        }
        try {
            if (this.#started === undefined) {
                // If the transaction hasn't started yet, start it now
                this.#started = stream
                    .run(transactionModeToBegin(this.#mode))
                    .then(() => undefined);
                try {
                    await this.#started;
                }
                catch (e) {
                    this.close();
                    throw e;
                }
            }
            else {
                // Wait until the transaction has started
                await this.#started;
            }
            await stream.sequence(sql);
        }
        catch (e) {
            throw mapHranaError(e);
        }
    }
    async rollback() {
        try {
            const stream = this._getStream();
            if (stream.closed) {
                return;
            }
            if (this.#started !== undefined) {
                // We don't have to wait for the BEGIN statement to complete. If the BEGIN fails, we will
                // execute a ROLLBACK outside of an active transaction, which should be harmless.
            }
            else {
                // We did nothing in the transaction, so there is nothing to rollback.
                return;
            }
            // Pipeline the ROLLBACK statement and the stream close.
            const promise = stream.run("ROLLBACK").catch((e) => {
                throw mapHranaError(e);
            });
            stream.closeGracefully();
            await promise;
        }
        catch (e) {
            throw mapHranaError(e);
        }
        finally {
            // `this.close()` may close the `hrana.Client`, which aborts all pending stream requests, so we
            // must call it _after_ we receive the ROLLBACK response.
            // Also note that the current stream should already be closed, but we need to call `this.close()`
            // anyway, because it may need to do more cleanup.
            this.close();
        }
    }
    async commit() {
        // (this method is analogous to `rollback()`)
        try {
            const stream = this._getStream();
            if (stream.closed) {
                throw new LibsqlError("Cannot commit the transaction because it is already closed", "TRANSACTION_CLOSED");
            }
            if (this.#started !== undefined) {
                // Make sure to execute the COMMIT only if the BEGIN was successful.
                await this.#started;
            }
            else {
                return;
            }
            const promise = stream.run("COMMIT").catch((e) => {
                throw mapHranaError(e);
            });
            stream.closeGracefully();
            await promise;
        }
        catch (e) {
            throw mapHranaError(e);
        }
        finally {
            this.close();
        }
    }
}
async function executeHranaBatch(mode, version, batch, hranaStmts, disableForeignKeys = false) {
    if (disableForeignKeys) {
        batch.step().run("PRAGMA foreign_keys=off");
    }
    const beginStep = batch.step();
    const beginPromise = beginStep.run(transactionModeToBegin(mode));
    let lastStep = beginStep;
    const stmtPromises = hranaStmts.map((hranaStmt) => {
        const stmtStep = batch.step().condition(BatchCond$2.ok(lastStep));
        if (version >= 3) {
            stmtStep.condition(BatchCond$2.not(BatchCond$2.isAutocommit(batch)));
        }
        const stmtPromise = stmtStep.query(hranaStmt);
        lastStep = stmtStep;
        return stmtPromise;
    });
    const commitStep = batch.step().condition(BatchCond$2.ok(lastStep));
    if (version >= 3) {
        commitStep.condition(BatchCond$2.not(BatchCond$2.isAutocommit(batch)));
    }
    const commitPromise = commitStep.run("COMMIT");
    const rollbackStep = batch
        .step()
        .condition(BatchCond$2.not(BatchCond$2.ok(commitStep)));
    rollbackStep.run("ROLLBACK").catch((_) => undefined);
    if (disableForeignKeys) {
        batch.step().run("PRAGMA foreign_keys=on");
    }
    await batch.execute();
    const resultSets = [];
    await beginPromise;
    for (const stmtPromise of stmtPromises) {
        const hranaRows = await stmtPromise;
        if (hranaRows === undefined) {
            throw new LibsqlError("Statement in a batch was not executed, probably because the transaction has been rolled back", "TRANSACTION_CLOSED");
        }
        resultSets.push(resultSetFromHrana(hranaRows));
    }
    await commitPromise;
    return resultSets;
}
function stmtToHrana(stmt) {
    let sql;
    let args;
    if (Array.isArray(stmt)) {
        [sql, args] = stmt;
    }
    else if (typeof stmt === "string") {
        sql = stmt;
    }
    else {
        sql = stmt.sql;
        args = stmt.args;
    }
    const hranaStmt = new Stmt$2(sql);
    if (args) {
        if (Array.isArray(args)) {
            hranaStmt.bindIndexes(args);
        }
        else {
            for (const [key, value] of Object.entries(args)) {
                hranaStmt.bindName(key, value);
            }
        }
    }
    return hranaStmt;
}
function resultSetFromHrana(hranaRows) {
    const columns = hranaRows.columnNames.map((c) => c ?? "");
    const columnTypes = hranaRows.columnDecltypes.map((c) => c ?? "");
    const rows = hranaRows.rows;
    const rowsAffected = hranaRows.affectedRowCount;
    const lastInsertRowid = hranaRows.lastInsertRowid !== undefined
        ? hranaRows.lastInsertRowid
        : undefined;
    return new ResultSetImpl(columns, columnTypes, rows, rowsAffected, lastInsertRowid);
}
function mapHranaError(e) {
    if (e instanceof ClientError) {
        const code = mapHranaErrorCode(e);
        return new LibsqlError(e.message, code, undefined, e);
    }
    return e;
}
function mapHranaErrorCode(e) {
    if (e instanceof ResponseError && e.code !== undefined) {
        return e.code;
    }
    else if (e instanceof ProtoError) {
        return "HRANA_PROTO_ERROR";
    }
    else if (e instanceof ClosedError) {
        return e.cause instanceof ClientError
            ? mapHranaErrorCode(e.cause)
            : "HRANA_CLOSED_ERROR";
    }
    else if (e instanceof WebSocketError) {
        return "HRANA_WEBSOCKET_ERROR";
    }
    else if (e instanceof HttpServerError) {
        return "SERVER_ERROR";
    }
    else if (e instanceof ProtocolVersionError) {
        return "PROTOCOL_VERSION_ERROR";
    }
    else if (e instanceof InternalError) {
        return "INTERNAL_ERROR";
    }
    else {
        return "UNKNOWN";
    }
}

class SqlCache {
    #owner;
    #sqls;
    capacity;
    constructor(owner, capacity) {
        this.#owner = owner;
        this.#sqls = new Lru();
        this.capacity = capacity;
    }
    // Replaces SQL strings with cached `hrana.Sql` objects in the statements in `hranaStmts`. After this
    // function returns, we guarantee that all `hranaStmts` refer to valid (not closed) `hrana.Sql` objects,
    // but _we may invalidate any other `hrana.Sql` objects_ (by closing them, thus removing them from the
    // server).
    //
    // In practice, this means that after calling this function, you can use the statements only up to the
    // first `await`, because concurrent code may also use the cache and invalidate those statements.
    apply(hranaStmts) {
        if (this.capacity <= 0) {
            return;
        }
        const usedSqlObjs = new Set();
        for (const hranaStmt of hranaStmts) {
            if (typeof hranaStmt.sql !== "string") {
                continue;
            }
            const sqlText = hranaStmt.sql;
            // Stored SQL cannot exceed 5kb.
            // https://github.com/tursodatabase/libsql/blob/e9d637e051685f92b0da43849507b5ef4232fbeb/libsql-server/src/hrana/http/request.rs#L10
            if (sqlText.length >= 5000) {
                continue;
            }
            let sqlObj = this.#sqls.get(sqlText);
            if (sqlObj === undefined) {
                while (this.#sqls.size + 1 > this.capacity) {
                    const [evictSqlText, evictSqlObj] = this.#sqls.peekLru();
                    if (usedSqlObjs.has(evictSqlObj)) {
                        // The SQL object that we are trying to evict is already in use in this batch, so we
                        // must not evict and close it.
                        break;
                    }
                    evictSqlObj.close();
                    this.#sqls.delete(evictSqlText);
                }
                if (this.#sqls.size + 1 <= this.capacity) {
                    sqlObj = this.#owner.storeSql(sqlText);
                    this.#sqls.set(sqlText, sqlObj);
                }
            }
            if (sqlObj !== undefined) {
                hranaStmt.sql = sqlObj;
                usedSqlObjs.add(sqlObj);
            }
        }
    }
}
class Lru {
    // This maps keys to the cache values. The entries are ordered by their last use (entires that were used
    // most recently are at the end).
    #cache;
    constructor() {
        this.#cache = new Map();
    }
    get(key) {
        const value = this.#cache.get(key);
        if (value !== undefined) {
            // move the entry to the back of the Map
            this.#cache.delete(key);
            this.#cache.set(key, value);
        }
        return value;
    }
    set(key, value) {
        this.#cache.set(key, value);
    }
    peekLru() {
        for (const entry of this.#cache.entries()) {
            return entry;
        }
        return undefined;
    }
    delete(key) {
        this.#cache.delete(key);
    }
    get size() {
        return this.#cache.size;
    }
}

function limiter (count) {
  var outstanding = 0;
  var jobs = [];

  function remove () {
    outstanding--;

    if (outstanding < count) {
      dequeue();
    }
  }

  function dequeue () {
    var job = jobs.shift();
    semaphore.queue = jobs.length;

    if (job) {
      run(job.fn).then(job.resolve).catch(job.reject);
    }
  }

  function queue (fn) {
    return new Promise(function (resolve, reject) {
      jobs.push({fn: fn, resolve: resolve, reject: reject});
      semaphore.queue = jobs.length;
    })
  }

  function run (fn) {
    outstanding++;
    try {
      return Promise.resolve(fn()).then(function (result) {
        remove();
        return result
      }, function (error) {
        remove();
        throw error
      })
    } catch (err) {
      remove();
      return Promise.reject(err)
    }
  }

  var semaphore = function (fn) {
    if (outstanding >= count) {
      return queue(fn)
    } else {
      return run(fn)
    }
  };

  return semaphore
}

function map (items, mapper) {
  var failed = false;

  var limit = this;

  return Promise.all(items.map(function () {
    var args = arguments;
    return limit(function () {
      if (!failed) {
        return mapper.apply(undefined, args).catch(function (e) {
          failed = true;
          throw e
        })
      }
    })
  }))
}

function addExtras (fn) {
  fn.queue = 0;
  fn.map = map;
  return fn
}

var promiseLimit = function (count) {
  if (count) {
    return addExtras(limiter(count))
  } else {
    return addExtras(function (fn) {
      return fn()
    })
  }
};

const promiseLimit$1 = /*@__PURE__*/getDefaultExportFromCjs(promiseLimit);

/** @private */
function _createClient$2(config) {
    if (config.scheme !== "wss" && config.scheme !== "ws") {
        throw new LibsqlError('The WebSocket client supports only "libsql:", "wss:" and "ws:" URLs, ' +
            `got ${JSON.stringify(config.scheme + ":")}. For more information, please read ${supportedUrlLink}`, "URL_SCHEME_NOT_SUPPORTED");
    }
    if (config.encryptionKey !== undefined) {
        throw new LibsqlError("Encryption key is not supported by the remote client.", "ENCRYPTION_KEY_NOT_SUPPORTED");
    }
    if (config.scheme === "ws" && config.tls) {
        throw new LibsqlError(`A "ws:" URL cannot opt into TLS by using ?tls=1`, "URL_INVALID");
    }
    else if (config.scheme === "wss" && !config.tls) {
        throw new LibsqlError(`A "wss:" URL cannot opt out of TLS by using ?tls=0`, "URL_INVALID");
    }
    const url = encodeBaseUrl(config.scheme, config.authority, config.path);
    let client;
    try {
        client = openWs(url, config.authToken);
    }
    catch (e) {
        if (e instanceof WebSocketUnsupportedError) {
            const suggestedScheme = config.scheme === "wss" ? "https" : "http";
            const suggestedUrl = encodeBaseUrl(suggestedScheme, config.authority, config.path);
            throw new LibsqlError("This environment does not support WebSockets, please switch to the HTTP client by using " +
                `a "${suggestedScheme}:" URL (${JSON.stringify(suggestedUrl)}). ` +
                `For more information, please read ${supportedUrlLink}`, "WEBSOCKETS_NOT_SUPPORTED");
        }
        throw mapHranaError(e);
    }
    return new WsClient(client, url, config.authToken, config.intMode, config.concurrency);
}
const maxConnAgeMillis = 60 * 1000;
const sqlCacheCapacity$1 = 100;
class WsClient {
    #url;
    #authToken;
    #intMode;
    // State of the current connection. The `hrana.WsClient` inside may be closed at any moment due to an
    // asynchronous error.
    #connState;
    // If defined, this is a connection that will be used in the future, once it is ready.
    #futureConnState;
    closed;
    protocol;
    #isSchemaDatabase;
    #promiseLimitFunction;
    /** @private */
    constructor(client, url, authToken, intMode, concurrency) {
        this.#url = url;
        this.#authToken = authToken;
        this.#intMode = intMode;
        this.#connState = this.#openConn(client);
        this.#futureConnState = undefined;
        this.closed = false;
        this.protocol = "ws";
        this.#promiseLimitFunction = promiseLimit$1(concurrency);
    }
    async limit(fn) {
        return this.#promiseLimitFunction(fn);
    }
    async execute(stmtOrSql, args) {
        let stmt;
        if (typeof stmtOrSql === "string") {
            stmt = {
                sql: stmtOrSql,
                args: args || [],
            };
        }
        else {
            stmt = stmtOrSql;
        }
        return this.limit(async () => {
            const streamState = await this.#openStream();
            try {
                const hranaStmt = stmtToHrana(stmt);
                // Schedule all operations synchronously, so they will be pipelined and executed in a single
                // network roundtrip.
                streamState.conn.sqlCache.apply([hranaStmt]);
                const hranaRowsPromise = streamState.stream.query(hranaStmt);
                streamState.stream.closeGracefully();
                const hranaRowsResult = await hranaRowsPromise;
                return resultSetFromHrana(hranaRowsResult);
            }
            catch (e) {
                throw mapHranaError(e);
            }
            finally {
                this._closeStream(streamState);
            }
        });
    }
    async batch(stmts, mode = "deferred") {
        return this.limit(async () => {
            const streamState = await this.#openStream();
            try {
                const normalizedStmts = stmts.map((stmt) => {
                    if (Array.isArray(stmt)) {
                        return {
                            sql: stmt[0],
                            args: stmt[1] || [],
                        };
                    }
                    return stmt;
                });
                const hranaStmts = normalizedStmts.map(stmtToHrana);
                const version = await streamState.conn.client.getVersion();
                // Schedule all operations synchronously, so they will be pipelined and executed in a single
                // network roundtrip.
                streamState.conn.sqlCache.apply(hranaStmts);
                const batch = streamState.stream.batch(version >= 3);
                const resultsPromise = executeHranaBatch(mode, version, batch, hranaStmts);
                const results = await resultsPromise;
                return results;
            }
            catch (e) {
                throw mapHranaError(e);
            }
            finally {
                this._closeStream(streamState);
            }
        });
    }
    async migrate(stmts) {
        return this.limit(async () => {
            const streamState = await this.#openStream();
            try {
                const hranaStmts = stmts.map(stmtToHrana);
                const version = await streamState.conn.client.getVersion();
                // Schedule all operations synchronously, so they will be pipelined and executed in a single
                // network roundtrip.
                const batch = streamState.stream.batch(version >= 3);
                const resultsPromise = executeHranaBatch("deferred", version, batch, hranaStmts, true);
                const results = await resultsPromise;
                return results;
            }
            catch (e) {
                throw mapHranaError(e);
            }
            finally {
                this._closeStream(streamState);
            }
        });
    }
    async transaction(mode = "write") {
        return this.limit(async () => {
            const streamState = await this.#openStream();
            try {
                const version = await streamState.conn.client.getVersion();
                // the BEGIN statement will be batched with the first statement on the transaction to save a
                // network roundtrip
                return new WsTransaction(this, streamState, mode, version);
            }
            catch (e) {
                this._closeStream(streamState);
                throw mapHranaError(e);
            }
        });
    }
    async executeMultiple(sql) {
        return this.limit(async () => {
            const streamState = await this.#openStream();
            try {
                // Schedule all operations synchronously, so they will be pipelined and executed in a single
                // network roundtrip.
                const promise = streamState.stream.sequence(sql);
                streamState.stream.closeGracefully();
                await promise;
            }
            catch (e) {
                throw mapHranaError(e);
            }
            finally {
                this._closeStream(streamState);
            }
        });
    }
    sync() {
        throw new LibsqlError("sync not supported in ws mode", "SYNC_NOT_SUPPORTED");
    }
    async #openStream() {
        if (this.closed) {
            throw new LibsqlError("The client is closed", "CLIENT_CLOSED");
        }
        const now = new Date();
        const ageMillis = now.valueOf() - this.#connState.openTime.valueOf();
        if (ageMillis > maxConnAgeMillis &&
            this.#futureConnState === undefined) {
            // The existing connection is too old, let's open a new one.
            const futureConnState = this.#openConn();
            this.#futureConnState = futureConnState;
            // However, if we used `futureConnState` immediately, we would introduce additional latency,
            // because we would have to wait for the WebSocket handshake to complete, even though we may a
            // have perfectly good existing connection in `this.#connState`!
            //
            // So we wait until the `hrana.Client.getVersion()` operation completes (which happens when the
            // WebSocket hanshake completes), and only then we replace `this.#connState` with
            // `futureConnState`, which is stored in `this.#futureConnState` in the meantime.
            futureConnState.client.getVersion().then((_version) => {
                if (this.#connState !== futureConnState) {
                    // We need to close `this.#connState` before we replace it. However, it is possible
                    // that `this.#connState` has already been replaced: see the code below.
                    if (this.#connState.streamStates.size === 0) {
                        this.#connState.client.close();
                    }
                }
                this.#connState = futureConnState;
                this.#futureConnState = undefined;
            }, (_e) => {
                // If the new connection could not be established, let's just ignore the error and keep
                // using the existing connection.
                this.#futureConnState = undefined;
            });
        }
        if (this.#connState.client.closed) {
            // An error happened on this connection and it has been closed. Let's try to seamlessly reconnect.
            try {
                if (this.#futureConnState !== undefined) {
                    // We are already in the process of opening a new connection, so let's just use it
                    // immediately.
                    this.#connState = this.#futureConnState;
                }
                else {
                    this.#connState = this.#openConn();
                }
            }
            catch (e) {
                throw mapHranaError(e);
            }
        }
        const connState = this.#connState;
        try {
            // Now we wait for the WebSocket handshake to complete (if it hasn't completed yet). Note that
            // this does not increase latency, because any messages that we would send on the WebSocket before
            // the handshake would be queued until the handshake is completed anyway.
            if (connState.useSqlCache === undefined) {
                connState.useSqlCache =
                    (await connState.client.getVersion()) >= 2;
                if (connState.useSqlCache) {
                    connState.sqlCache.capacity = sqlCacheCapacity$1;
                }
            }
            const stream = connState.client.openStream();
            stream.intMode = this.#intMode;
            const streamState = { conn: connState, stream };
            connState.streamStates.add(streamState);
            return streamState;
        }
        catch (e) {
            throw mapHranaError(e);
        }
    }
    #openConn(client) {
        try {
            client ??= openWs(this.#url, this.#authToken);
            return {
                client,
                useSqlCache: undefined,
                sqlCache: new SqlCache(client, 0),
                openTime: new Date(),
                streamStates: new Set(),
            };
        }
        catch (e) {
            throw mapHranaError(e);
        }
    }
    async reconnect() {
        try {
            for (const st of Array.from(this.#connState.streamStates)) {
                try {
                    st.stream.close();
                }
                catch { }
            }
            this.#connState.client.close();
        }
        catch { }
        if (this.#futureConnState) {
            try {
                this.#futureConnState.client.close();
            }
            catch { }
            this.#futureConnState = undefined;
        }
        const next = this.#openConn();
        const version = await next.client.getVersion();
        next.useSqlCache = version >= 2;
        if (next.useSqlCache) {
            next.sqlCache.capacity = sqlCacheCapacity$1;
        }
        this.#connState = next;
        this.closed = false;
    }
    _closeStream(streamState) {
        streamState.stream.close();
        const connState = streamState.conn;
        connState.streamStates.delete(streamState);
        if (connState.streamStates.size === 0 &&
            connState !== this.#connState) {
            // We are not using this connection anymore and this is the last stream that was using it, so we
            // must close it now.
            connState.client.close();
        }
    }
    close() {
        this.#connState.client.close();
        this.closed = true;
        if (this.#futureConnState) {
            try {
                this.#futureConnState.client.close();
            }
            catch { }
            this.#futureConnState = undefined;
        }
        this.closed = true;
    }
}
class WsTransaction extends HranaTransaction {
    #client;
    #streamState;
    /** @private */
    constructor(client, state, mode, version) {
        super(mode, version);
        this.#client = client;
        this.#streamState = state;
    }
    /** @private */
    _getStream() {
        return this.#streamState.stream;
    }
    /** @private */
    _getSqlCache() {
        return this.#streamState.conn.sqlCache;
    }
    close() {
        this.#client._closeStream(this.#streamState);
    }
    get closed() {
        return this.#streamState.stream.closed;
    }
}

/** @private */
function _createClient$1(config) {
    if (config.scheme !== "https" && config.scheme !== "http") {
        throw new LibsqlError('The HTTP client supports only "libsql:", "https:" and "http:" URLs, ' +
            `got ${JSON.stringify(config.scheme + ":")}. For more information, please read ${supportedUrlLink}`, "URL_SCHEME_NOT_SUPPORTED");
    }
    if (config.encryptionKey !== undefined) {
        throw new LibsqlError("Encryption key is not supported by the remote client.", "ENCRYPTION_KEY_NOT_SUPPORTED");
    }
    if (config.scheme === "http" && config.tls) {
        throw new LibsqlError(`A "http:" URL cannot opt into TLS by using ?tls=1`, "URL_INVALID");
    }
    else if (config.scheme === "https" && !config.tls) {
        throw new LibsqlError(`A "https:" URL cannot opt out of TLS by using ?tls=0`, "URL_INVALID");
    }
    const url = encodeBaseUrl(config.scheme, config.authority, config.path);
    return new HttpClient(url, config.authToken, config.intMode, config.fetch, config.concurrency);
}
const sqlCacheCapacity = 30;
class HttpClient {
    #client;
    protocol;
    #url;
    #intMode;
    #customFetch;
    #concurrency;
    #authToken;
    #promiseLimitFunction;
    /** @private */
    constructor(url, authToken, intMode, customFetch, concurrency) {
        this.#url = url;
        this.#authToken = authToken;
        this.#intMode = intMode;
        this.#customFetch = customFetch;
        this.#concurrency = concurrency;
        this.#client = openHttp(this.#url, this.#authToken, this.#customFetch);
        this.#client.intMode = this.#intMode;
        this.protocol = "http";
        this.#promiseLimitFunction = promiseLimit$1(this.#concurrency);
    }
    async limit(fn) {
        return this.#promiseLimitFunction(fn);
    }
    async execute(stmtOrSql, args) {
        let stmt;
        if (typeof stmtOrSql === "string") {
            stmt = {
                sql: stmtOrSql,
                args: args || [],
            };
        }
        else {
            stmt = stmtOrSql;
        }
        return this.limit(async () => {
            try {
                const hranaStmt = stmtToHrana(stmt);
                // Pipeline all operations, so `hrana.HttpClient` can open the stream, execute the statement and
                // close the stream in a single HTTP request.
                let rowsPromise;
                const stream = this.#client.openStream();
                try {
                    rowsPromise = stream.query(hranaStmt);
                }
                finally {
                    stream.closeGracefully();
                }
                const rowsResult = await rowsPromise;
                return resultSetFromHrana(rowsResult);
            }
            catch (e) {
                throw mapHranaError(e);
            }
        });
    }
    async batch(stmts, mode = "deferred") {
        return this.limit(async () => {
            try {
                const normalizedStmts = stmts.map((stmt) => {
                    if (Array.isArray(stmt)) {
                        return {
                            sql: stmt[0],
                            args: stmt[1] || [],
                        };
                    }
                    return stmt;
                });
                const hranaStmts = normalizedStmts.map(stmtToHrana);
                const version = await this.#client.getVersion();
                // Pipeline all operations, so `hrana.HttpClient` can open the stream, execute the batch and
                // close the stream in a single HTTP request.
                let resultsPromise;
                const stream = this.#client.openStream();
                try {
                    // It makes sense to use a SQL cache even for a single batch, because it may contain the same
                    // statement repeated multiple times.
                    const sqlCache = new SqlCache(stream, sqlCacheCapacity);
                    sqlCache.apply(hranaStmts);
                    // TODO: we do not use a cursor here, because it would cause three roundtrips:
                    // 1. pipeline request to store SQL texts
                    // 2. cursor request
                    // 3. pipeline request to close the stream
                    const batch = stream.batch(false);
                    resultsPromise = executeHranaBatch(mode, version, batch, hranaStmts);
                }
                finally {
                    stream.closeGracefully();
                }
                const results = await resultsPromise;
                return results;
            }
            catch (e) {
                throw mapHranaError(e);
            }
        });
    }
    async migrate(stmts) {
        return this.limit(async () => {
            try {
                const hranaStmts = stmts.map(stmtToHrana);
                const version = await this.#client.getVersion();
                // Pipeline all operations, so `hrana.HttpClient` can open the stream, execute the batch and
                // close the stream in a single HTTP request.
                let resultsPromise;
                const stream = this.#client.openStream();
                try {
                    const batch = stream.batch(false);
                    resultsPromise = executeHranaBatch("deferred", version, batch, hranaStmts, true);
                }
                finally {
                    stream.closeGracefully();
                }
                const results = await resultsPromise;
                return results;
            }
            catch (e) {
                throw mapHranaError(e);
            }
        });
    }
    async transaction(mode = "write") {
        return this.limit(async () => {
            try {
                const version = await this.#client.getVersion();
                return new HttpTransaction(this.#client.openStream(), mode, version);
            }
            catch (e) {
                throw mapHranaError(e);
            }
        });
    }
    async executeMultiple(sql) {
        return this.limit(async () => {
            try {
                // Pipeline all operations, so `hrana.HttpClient` can open the stream, execute the sequence and
                // close the stream in a single HTTP request.
                let promise;
                const stream = this.#client.openStream();
                try {
                    promise = stream.sequence(sql);
                }
                finally {
                    stream.closeGracefully();
                }
                await promise;
            }
            catch (e) {
                throw mapHranaError(e);
            }
        });
    }
    sync() {
        throw new LibsqlError("sync not supported in http mode", "SYNC_NOT_SUPPORTED");
    }
    close() {
        this.#client.close();
    }
    async reconnect() {
        try {
            if (!this.closed) {
                // Abort in-flight ops and free resources
                this.#client.close();
            }
        }
        finally {
            // Recreate the underlying hrana client
            this.#client = openHttp(this.#url, this.#authToken, this.#customFetch);
            this.#client.intMode = this.#intMode;
        }
    }
    get closed() {
        return this.#client.closed;
    }
}
class HttpTransaction extends HranaTransaction {
    #stream;
    #sqlCache;
    /** @private */
    constructor(stream, mode, version) {
        super(mode, version);
        this.#stream = stream;
        this.#sqlCache = new SqlCache(stream, sqlCacheCapacity);
    }
    /** @private */
    _getStream() {
        return this.#stream;
    }
    /** @private */
    _getSqlCache() {
        return this.#sqlCache;
    }
    close() {
        this.#stream.close();
    }
    get closed() {
        return this.#stream.closed;
    }
}

function createClient(config) {
    return _createClient(expandConfig(config));
}
/** @private */
function _createClient(config) {
    if (config.scheme === "ws" || config.scheme === "wss") {
        return _createClient$2(config);
    }
    else if (config.scheme === "http" || config.scheme === "https") {
        return _createClient$1(config);
    }
    else {
        throw new LibsqlError('The client that uses Web standard APIs supports only "libsql:", "wss:", "ws:", "https:" and "http:" URLs, ' +
            `got ${JSON.stringify(config.scheme + ":")}. For more information, please read ${supportedUrlLink}`, "URL_SCHEME_NOT_SUPPORTED");
    }
}

const entityKind = Symbol.for("drizzle:entityKind");
function is(value, type) {
  if (!value || typeof value !== "object") {
    return false;
  }
  if (value instanceof type) {
    return true;
  }
  if (!Object.prototype.hasOwnProperty.call(type, entityKind)) {
    throw new Error(
      `Class "${type.name ?? "<unknown>"}" doesn't look like a Drizzle entity. If this is incorrect and the class is provided by Drizzle, please report this as a bug.`
    );
  }
  let cls = Object.getPrototypeOf(value).constructor;
  if (cls) {
    while (cls) {
      if (entityKind in cls && cls[entityKind] === type[entityKind]) {
        return true;
      }
      cls = Object.getPrototypeOf(cls);
    }
  }
  return false;
}

class Column {
  constructor(table, config) {
    this.table = table;
    this.config = config;
    this.name = config.name;
    this.keyAsName = config.keyAsName;
    this.notNull = config.notNull;
    this.default = config.default;
    this.defaultFn = config.defaultFn;
    this.onUpdateFn = config.onUpdateFn;
    this.hasDefault = config.hasDefault;
    this.primary = config.primaryKey;
    this.isUnique = config.isUnique;
    this.uniqueName = config.uniqueName;
    this.uniqueType = config.uniqueType;
    this.dataType = config.dataType;
    this.columnType = config.columnType;
    this.generated = config.generated;
    this.generatedIdentity = config.generatedIdentity;
  }
  static [entityKind] = "Column";
  name;
  keyAsName;
  primary;
  notNull;
  default;
  defaultFn;
  onUpdateFn;
  hasDefault;
  isUnique;
  uniqueName;
  uniqueType;
  dataType;
  columnType;
  enumValues = void 0;
  generated = void 0;
  generatedIdentity = void 0;
  config;
  mapFromDriverValue(value) {
    return value;
  }
  mapToDriverValue(value) {
    return value;
  }
  // ** @internal */
  shouldDisableInsert() {
    return this.config.generated !== void 0 && this.config.generated.type !== "byDefault";
  }
}

class ColumnBuilder {
  static [entityKind] = "ColumnBuilder";
  config;
  constructor(name, dataType, columnType) {
    this.config = {
      name,
      keyAsName: name === "",
      notNull: false,
      default: void 0,
      hasDefault: false,
      primaryKey: false,
      isUnique: false,
      uniqueName: void 0,
      uniqueType: void 0,
      dataType,
      columnType,
      generated: void 0
    };
  }
  /**
   * Changes the data type of the column. Commonly used with `json` columns. Also, useful for branded types.
   *
   * @example
   * ```ts
   * const users = pgTable('users', {
   * 	id: integer('id').$type<UserId>().primaryKey(),
   * 	details: json('details').$type<UserDetails>().notNull(),
   * });
   * ```
   */
  $type() {
    return this;
  }
  /**
   * Adds a `not null` clause to the column definition.
   *
   * Affects the `select` model of the table - columns *without* `not null` will be nullable on select.
   */
  notNull() {
    this.config.notNull = true;
    return this;
  }
  /**
   * Adds a `default <value>` clause to the column definition.
   *
   * Affects the `insert` model of the table - columns *with* `default` are optional on insert.
   *
   * If you need to set a dynamic default value, use {@link $defaultFn} instead.
   */
  default(value) {
    this.config.default = value;
    this.config.hasDefault = true;
    return this;
  }
  /**
   * Adds a dynamic default value to the column.
   * The function will be called when the row is inserted, and the returned value will be used as the column value.
   *
   * **Note:** This value does not affect the `drizzle-kit` behavior, it is only used at runtime in `drizzle-orm`.
   */
  $defaultFn(fn) {
    this.config.defaultFn = fn;
    this.config.hasDefault = true;
    return this;
  }
  /**
   * Alias for {@link $defaultFn}.
   */
  $default = this.$defaultFn;
  /**
   * Adds a dynamic update value to the column.
   * The function will be called when the row is updated, and the returned value will be used as the column value if none is provided.
   * If no `default` (or `$defaultFn`) value is provided, the function will be called when the row is inserted as well, and the returned value will be used as the column value.
   *
   * **Note:** This value does not affect the `drizzle-kit` behavior, it is only used at runtime in `drizzle-orm`.
   */
  $onUpdateFn(fn) {
    this.config.onUpdateFn = fn;
    this.config.hasDefault = true;
    return this;
  }
  /**
   * Alias for {@link $onUpdateFn}.
   */
  $onUpdate = this.$onUpdateFn;
  /**
   * Adds a `primary key` clause to the column definition. This implicitly makes the column `not null`.
   *
   * In SQLite, `integer primary key` implicitly makes the column auto-incrementing.
   */
  primaryKey() {
    this.config.primaryKey = true;
    this.config.notNull = true;
    return this;
  }
  /** @internal Sets the name of the column to the key within the table definition if a name was not given. */
  setName(name) {
    if (this.config.name !== "") return;
    this.config.name = name;
  }
}

const TableName = Symbol.for("drizzle:Name");

const isPgEnumSym = Symbol.for("drizzle:isPgEnum");
function isPgEnum(obj) {
  return !!obj && typeof obj === "function" && isPgEnumSym in obj && obj[isPgEnumSym] === true;
}

class Subquery {
  static [entityKind] = "Subquery";
  constructor(sql, fields, alias, isWith = false, usedTables = []) {
    this._ = {
      brand: "Subquery",
      sql,
      selectedFields: fields,
      alias,
      isWith,
      usedTables
    };
  }
  // getSQL(): SQL<unknown> {
  // 	return new SQL([this]);
  // }
}
class WithSubquery extends Subquery {
  static [entityKind] = "WithSubquery";
}

const tracer = {
  startActiveSpan(name, fn) {
    {
      return fn();
    }
  }
};

const ViewBaseConfig = Symbol.for("drizzle:ViewBaseConfig");

const Schema = Symbol.for("drizzle:Schema");
const Columns = Symbol.for("drizzle:Columns");
const ExtraConfigColumns = Symbol.for("drizzle:ExtraConfigColumns");
const OriginalName = Symbol.for("drizzle:OriginalName");
const BaseName = Symbol.for("drizzle:BaseName");
const IsAlias = Symbol.for("drizzle:IsAlias");
const ExtraConfigBuilder = Symbol.for("drizzle:ExtraConfigBuilder");
const IsDrizzleTable = Symbol.for("drizzle:IsDrizzleTable");
class Table {
  static [entityKind] = "Table";
  /** @internal */
  static Symbol = {
    Name: TableName,
    Schema,
    OriginalName,
    Columns,
    ExtraConfigColumns,
    BaseName,
    IsAlias,
    ExtraConfigBuilder
  };
  /**
   * @internal
   * Can be changed if the table is aliased.
   */
  [TableName];
  /**
   * @internal
   * Used to store the original name of the table, before any aliasing.
   */
  [OriginalName];
  /** @internal */
  [Schema];
  /** @internal */
  [Columns];
  /** @internal */
  [ExtraConfigColumns];
  /**
   *  @internal
   * Used to store the table name before the transformation via the `tableCreator` functions.
   */
  [BaseName];
  /** @internal */
  [IsAlias] = false;
  /** @internal */
  [IsDrizzleTable] = true;
  /** @internal */
  [ExtraConfigBuilder] = void 0;
  constructor(name, schema, baseName) {
    this[TableName] = this[OriginalName] = name;
    this[Schema] = schema;
    this[BaseName] = baseName;
  }
}
function getTableName(table) {
  return table[TableName];
}
function getTableUniqueName(table) {
  return `${table[Schema] ?? "public"}.${table[TableName]}`;
}

function isSQLWrapper(value) {
  return value !== null && value !== void 0 && typeof value.getSQL === "function";
}
function mergeQueries(queries) {
  const result = { sql: "", params: [] };
  for (const query of queries) {
    result.sql += query.sql;
    result.params.push(...query.params);
    if (query.typings?.length) {
      if (!result.typings) {
        result.typings = [];
      }
      result.typings.push(...query.typings);
    }
  }
  return result;
}
class StringChunk {
  static [entityKind] = "StringChunk";
  value;
  constructor(value) {
    this.value = Array.isArray(value) ? value : [value];
  }
  getSQL() {
    return new SQL([this]);
  }
}
class SQL {
  constructor(queryChunks) {
    this.queryChunks = queryChunks;
    for (const chunk of queryChunks) {
      if (is(chunk, Table)) {
        const schemaName = chunk[Table.Symbol.Schema];
        this.usedTables.push(
          schemaName === void 0 ? chunk[Table.Symbol.Name] : schemaName + "." + chunk[Table.Symbol.Name]
        );
      }
    }
  }
  static [entityKind] = "SQL";
  /** @internal */
  decoder = noopDecoder;
  shouldInlineParams = false;
  /** @internal */
  usedTables = [];
  append(query) {
    this.queryChunks.push(...query.queryChunks);
    return this;
  }
  toQuery(config) {
    return tracer.startActiveSpan("drizzle.buildSQL", (span) => {
      const query = this.buildQueryFromSourceParams(this.queryChunks, config);
      span?.setAttributes({
        "drizzle.query.text": query.sql,
        "drizzle.query.params": JSON.stringify(query.params)
      });
      return query;
    });
  }
  buildQueryFromSourceParams(chunks, _config) {
    const config = Object.assign({}, _config, {
      inlineParams: _config.inlineParams || this.shouldInlineParams,
      paramStartIndex: _config.paramStartIndex || { value: 0 }
    });
    const {
      casing,
      escapeName,
      escapeParam,
      prepareTyping,
      inlineParams,
      paramStartIndex
    } = config;
    return mergeQueries(chunks.map((chunk) => {
      if (is(chunk, StringChunk)) {
        return { sql: chunk.value.join(""), params: [] };
      }
      if (is(chunk, Name)) {
        return { sql: escapeName(chunk.value), params: [] };
      }
      if (chunk === void 0) {
        return { sql: "", params: [] };
      }
      if (Array.isArray(chunk)) {
        const result = [new StringChunk("(")];
        for (const [i, p] of chunk.entries()) {
          result.push(p);
          if (i < chunk.length - 1) {
            result.push(new StringChunk(", "));
          }
        }
        result.push(new StringChunk(")"));
        return this.buildQueryFromSourceParams(result, config);
      }
      if (is(chunk, SQL)) {
        return this.buildQueryFromSourceParams(chunk.queryChunks, {
          ...config,
          inlineParams: inlineParams || chunk.shouldInlineParams
        });
      }
      if (is(chunk, Table)) {
        const schemaName = chunk[Table.Symbol.Schema];
        const tableName = chunk[Table.Symbol.Name];
        return {
          sql: schemaName === void 0 || chunk[IsAlias] ? escapeName(tableName) : escapeName(schemaName) + "." + escapeName(tableName),
          params: []
        };
      }
      if (is(chunk, Column)) {
        const columnName = casing.getColumnCasing(chunk);
        if (_config.invokeSource === "indexes") {
          return { sql: escapeName(columnName), params: [] };
        }
        const schemaName = chunk.table[Table.Symbol.Schema];
        return {
          sql: chunk.table[IsAlias] || schemaName === void 0 ? escapeName(chunk.table[Table.Symbol.Name]) + "." + escapeName(columnName) : escapeName(schemaName) + "." + escapeName(chunk.table[Table.Symbol.Name]) + "." + escapeName(columnName),
          params: []
        };
      }
      if (is(chunk, View)) {
        const schemaName = chunk[ViewBaseConfig].schema;
        const viewName = chunk[ViewBaseConfig].name;
        return {
          sql: schemaName === void 0 || chunk[ViewBaseConfig].isAlias ? escapeName(viewName) : escapeName(schemaName) + "." + escapeName(viewName),
          params: []
        };
      }
      if (is(chunk, Param)) {
        if (is(chunk.value, Placeholder)) {
          return { sql: escapeParam(paramStartIndex.value++, chunk), params: [chunk], typings: ["none"] };
        }
        const mappedValue = chunk.value === null ? null : chunk.encoder.mapToDriverValue(chunk.value);
        if (is(mappedValue, SQL)) {
          return this.buildQueryFromSourceParams([mappedValue], config);
        }
        if (inlineParams) {
          return { sql: this.mapInlineParam(mappedValue, config), params: [] };
        }
        let typings = ["none"];
        if (prepareTyping) {
          typings = [prepareTyping(chunk.encoder)];
        }
        return { sql: escapeParam(paramStartIndex.value++, mappedValue), params: [mappedValue], typings };
      }
      if (is(chunk, Placeholder)) {
        return { sql: escapeParam(paramStartIndex.value++, chunk), params: [chunk], typings: ["none"] };
      }
      if (is(chunk, SQL.Aliased) && chunk.fieldAlias !== void 0) {
        return { sql: escapeName(chunk.fieldAlias), params: [] };
      }
      if (is(chunk, Subquery)) {
        if (chunk._.isWith) {
          return { sql: escapeName(chunk._.alias), params: [] };
        }
        return this.buildQueryFromSourceParams([
          new StringChunk("("),
          chunk._.sql,
          new StringChunk(") "),
          new Name(chunk._.alias)
        ], config);
      }
      if (isPgEnum(chunk)) {
        if (chunk.schema) {
          return { sql: escapeName(chunk.schema) + "." + escapeName(chunk.enumName), params: [] };
        }
        return { sql: escapeName(chunk.enumName), params: [] };
      }
      if (isSQLWrapper(chunk)) {
        if (chunk.shouldOmitSQLParens?.()) {
          return this.buildQueryFromSourceParams([chunk.getSQL()], config);
        }
        return this.buildQueryFromSourceParams([
          new StringChunk("("),
          chunk.getSQL(),
          new StringChunk(")")
        ], config);
      }
      if (inlineParams) {
        return { sql: this.mapInlineParam(chunk, config), params: [] };
      }
      return { sql: escapeParam(paramStartIndex.value++, chunk), params: [chunk], typings: ["none"] };
    }));
  }
  mapInlineParam(chunk, { escapeString }) {
    if (chunk === null) {
      return "null";
    }
    if (typeof chunk === "number" || typeof chunk === "boolean") {
      return chunk.toString();
    }
    if (typeof chunk === "string") {
      return escapeString(chunk);
    }
    if (typeof chunk === "object") {
      const mappedValueAsString = chunk.toString();
      if (mappedValueAsString === "[object Object]") {
        return escapeString(JSON.stringify(chunk));
      }
      return escapeString(mappedValueAsString);
    }
    throw new Error("Unexpected param value: " + chunk);
  }
  getSQL() {
    return this;
  }
  as(alias) {
    if (alias === void 0) {
      return this;
    }
    return new SQL.Aliased(this, alias);
  }
  mapWith(decoder) {
    this.decoder = typeof decoder === "function" ? { mapFromDriverValue: decoder } : decoder;
    return this;
  }
  inlineParams() {
    this.shouldInlineParams = true;
    return this;
  }
  /**
   * This method is used to conditionally include a part of the query.
   *
   * @param condition - Condition to check
   * @returns itself if the condition is `true`, otherwise `undefined`
   */
  if(condition) {
    return condition ? this : void 0;
  }
}
class Name {
  constructor(value) {
    this.value = value;
  }
  static [entityKind] = "Name";
  brand;
  getSQL() {
    return new SQL([this]);
  }
}
function isDriverValueEncoder(value) {
  return typeof value === "object" && value !== null && "mapToDriverValue" in value && typeof value.mapToDriverValue === "function";
}
const noopDecoder = {
  mapFromDriverValue: (value) => value
};
const noopEncoder = {
  mapToDriverValue: (value) => value
};
({
  ...noopDecoder,
  ...noopEncoder
});
class Param {
  /**
   * @param value - Parameter value
   * @param encoder - Encoder to convert the value to a driver parameter
   */
  constructor(value, encoder = noopEncoder) {
    this.value = value;
    this.encoder = encoder;
  }
  static [entityKind] = "Param";
  brand;
  getSQL() {
    return new SQL([this]);
  }
}
function sql(strings, ...params) {
  const queryChunks = [];
  if (params.length > 0 || strings.length > 0 && strings[0] !== "") {
    queryChunks.push(new StringChunk(strings[0]));
  }
  for (const [paramIndex, param2] of params.entries()) {
    queryChunks.push(param2, new StringChunk(strings[paramIndex + 1]));
  }
  return new SQL(queryChunks);
}
((sql2) => {
  function empty() {
    return new SQL([]);
  }
  sql2.empty = empty;
  function fromList(list) {
    return new SQL(list);
  }
  sql2.fromList = fromList;
  function raw(str) {
    return new SQL([new StringChunk(str)]);
  }
  sql2.raw = raw;
  function join(chunks, separator) {
    const result = [];
    for (const [i, chunk] of chunks.entries()) {
      if (i > 0 && separator !== void 0) {
        result.push(separator);
      }
      result.push(chunk);
    }
    return new SQL(result);
  }
  sql2.join = join;
  function identifier(value) {
    return new Name(value);
  }
  sql2.identifier = identifier;
  function placeholder2(name2) {
    return new Placeholder(name2);
  }
  sql2.placeholder = placeholder2;
  function param2(value, encoder) {
    return new Param(value, encoder);
  }
  sql2.param = param2;
})(sql || (sql = {}));
((SQL2) => {
  class Aliased {
    constructor(sql2, fieldAlias) {
      this.sql = sql2;
      this.fieldAlias = fieldAlias;
    }
    static [entityKind] = "SQL.Aliased";
    /** @internal */
    isSelectionField = false;
    getSQL() {
      return this.sql;
    }
    /** @internal */
    clone() {
      return new Aliased(this.sql, this.fieldAlias);
    }
  }
  SQL2.Aliased = Aliased;
})(SQL || (SQL = {}));
class Placeholder {
  constructor(name2) {
    this.name = name2;
  }
  static [entityKind] = "Placeholder";
  getSQL() {
    return new SQL([this]);
  }
}
function fillPlaceholders(params, values) {
  return params.map((p) => {
    if (is(p, Placeholder)) {
      if (!(p.name in values)) {
        throw new Error(`No value for placeholder "${p.name}" was provided`);
      }
      return values[p.name];
    }
    if (is(p, Param) && is(p.value, Placeholder)) {
      if (!(p.value.name in values)) {
        throw new Error(`No value for placeholder "${p.value.name}" was provided`);
      }
      return p.encoder.mapToDriverValue(values[p.value.name]);
    }
    return p;
  });
}
const IsDrizzleView = Symbol.for("drizzle:IsDrizzleView");
class View {
  static [entityKind] = "View";
  /** @internal */
  [ViewBaseConfig];
  /** @internal */
  [IsDrizzleView] = true;
  constructor({ name: name2, schema, selectedFields, query }) {
    this[ViewBaseConfig] = {
      name: name2,
      originalName: name2,
      schema,
      selectedFields,
      query,
      isExisting: !query,
      isAlias: false
    };
  }
  getSQL() {
    return new SQL([this]);
  }
}
Column.prototype.getSQL = function() {
  return new SQL([this]);
};
Table.prototype.getSQL = function() {
  return new SQL([this]);
};
Subquery.prototype.getSQL = function() {
  return new SQL([this]);
};

function mapResultRow(columns, row, joinsNotNullableMap) {
  const nullifyMap = {};
  const result = columns.reduce(
    (result2, { path, field }, columnIndex) => {
      let decoder;
      if (is(field, Column)) {
        decoder = field;
      } else if (is(field, SQL)) {
        decoder = field.decoder;
      } else {
        decoder = field.sql.decoder;
      }
      let node = result2;
      for (const [pathChunkIndex, pathChunk] of path.entries()) {
        if (pathChunkIndex < path.length - 1) {
          if (!(pathChunk in node)) {
            node[pathChunk] = {};
          }
          node = node[pathChunk];
        } else {
          const rawValue = row[columnIndex];
          const value = node[pathChunk] = rawValue === null ? null : decoder.mapFromDriverValue(rawValue);
          if (joinsNotNullableMap && is(field, Column) && path.length === 2) {
            const objectName = path[0];
            if (!(objectName in nullifyMap)) {
              nullifyMap[objectName] = value === null ? getTableName(field.table) : false;
            } else if (typeof nullifyMap[objectName] === "string" && nullifyMap[objectName] !== getTableName(field.table)) {
              nullifyMap[objectName] = false;
            }
          }
        }
      }
      return result2;
    },
    {}
  );
  if (joinsNotNullableMap && Object.keys(nullifyMap).length > 0) {
    for (const [objectName, tableName] of Object.entries(nullifyMap)) {
      if (typeof tableName === "string" && !joinsNotNullableMap[tableName]) {
        result[objectName] = null;
      }
    }
  }
  return result;
}
function orderSelectedFields(fields, pathPrefix) {
  return Object.entries(fields).reduce((result, [name, field]) => {
    if (typeof name !== "string") {
      return result;
    }
    const newPath = pathPrefix ? [...pathPrefix, name] : [name];
    if (is(field, Column) || is(field, SQL) || is(field, SQL.Aliased)) {
      result.push({ path: newPath, field });
    } else if (is(field, Table)) {
      result.push(...orderSelectedFields(field[Table.Symbol.Columns], newPath));
    } else {
      result.push(...orderSelectedFields(field, newPath));
    }
    return result;
  }, []);
}
function haveSameKeys(left, right) {
  const leftKeys = Object.keys(left);
  const rightKeys = Object.keys(right);
  if (leftKeys.length !== rightKeys.length) {
    return false;
  }
  for (const [index, key] of leftKeys.entries()) {
    if (key !== rightKeys[index]) {
      return false;
    }
  }
  return true;
}
function mapUpdateSet(table, values) {
  const entries = Object.entries(values).filter(([, value]) => value !== void 0).map(([key, value]) => {
    if (is(value, SQL) || is(value, Column)) {
      return [key, value];
    } else {
      return [key, new Param(value, table[Table.Symbol.Columns][key])];
    }
  });
  if (entries.length === 0) {
    throw new Error("No values to set");
  }
  return Object.fromEntries(entries);
}
function applyMixins(baseClass, extendedClasses) {
  for (const extendedClass of extendedClasses) {
    for (const name of Object.getOwnPropertyNames(extendedClass.prototype)) {
      if (name === "constructor") continue;
      Object.defineProperty(
        baseClass.prototype,
        name,
        Object.getOwnPropertyDescriptor(extendedClass.prototype, name) || /* @__PURE__ */ Object.create(null)
      );
    }
  }
}
function getTableColumns(table) {
  return table[Table.Symbol.Columns];
}
function getTableLikeName(table) {
  return is(table, Subquery) ? table._.alias : is(table, View) ? table[ViewBaseConfig].name : is(table, SQL) ? void 0 : table[Table.Symbol.IsAlias] ? table[Table.Symbol.Name] : table[Table.Symbol.BaseName];
}
function getColumnNameAndConfig(a, b) {
  return {
    name: typeof a === "string" && a.length > 0 ? a : "",
    config: typeof a === "object" ? a : b
  };
}
function isConfig(data) {
  if (typeof data !== "object" || data === null) return false;
  if (data.constructor.name !== "Object") return false;
  if ("logger" in data) {
    const type = typeof data["logger"];
    if (type !== "boolean" && (type !== "object" || typeof data["logger"]["logQuery"] !== "function") && type !== "undefined") return false;
    return true;
  }
  if ("schema" in data) {
    const type = typeof data["schema"];
    if (type !== "object" && type !== "undefined") return false;
    return true;
  }
  if ("casing" in data) {
    const type = typeof data["casing"];
    if (type !== "string" && type !== "undefined") return false;
    return true;
  }
  if ("mode" in data) {
    if (data["mode"] !== "default" || data["mode"] !== "planetscale" || data["mode"] !== void 0) return false;
    return true;
  }
  if ("connection" in data) {
    const type = typeof data["connection"];
    if (type !== "string" && type !== "object" && type !== "undefined") return false;
    return true;
  }
  if ("client" in data) {
    const type = typeof data["client"];
    if (type !== "object" && type !== "function" && type !== "undefined") return false;
    return true;
  }
  if (Object.keys(data).length === 0) return true;
  return false;
}
const textDecoder = typeof TextDecoder === "undefined" ? null : new TextDecoder();

class ConsoleLogWriter {
  static [entityKind] = "ConsoleLogWriter";
  write(message) {
    console.log(message);
  }
}
class DefaultLogger {
  static [entityKind] = "DefaultLogger";
  writer;
  constructor(config) {
    this.writer = config?.writer ?? new ConsoleLogWriter();
  }
  logQuery(query, params) {
    const stringifiedParams = params.map((p) => {
      try {
        return JSON.stringify(p);
      } catch {
        return String(p);
      }
    });
    const paramsStr = stringifiedParams.length ? ` -- params: [${stringifiedParams.join(", ")}]` : "";
    this.writer.write(`Query: ${query}${paramsStr}`);
  }
}
class NoopLogger {
  static [entityKind] = "NoopLogger";
  logQuery() {
  }
}

const InlineForeignKeys$1 = Symbol.for("drizzle:PgInlineForeignKeys");
const EnableRLS = Symbol.for("drizzle:EnableRLS");
class PgTable extends Table {
  static [entityKind] = "PgTable";
  /** @internal */
  static Symbol = Object.assign({}, Table.Symbol, {
    InlineForeignKeys: InlineForeignKeys$1,
    EnableRLS
  });
  /**@internal */
  [InlineForeignKeys$1] = [];
  /** @internal */
  [EnableRLS] = false;
  /** @internal */
  [Table.Symbol.ExtraConfigBuilder] = void 0;
  /** @internal */
  [Table.Symbol.ExtraConfigColumns] = {};
}

class PrimaryKeyBuilder {
  static [entityKind] = "PgPrimaryKeyBuilder";
  /** @internal */
  columns;
  /** @internal */
  name;
  constructor(columns, name) {
    this.columns = columns;
    this.name = name;
  }
  /** @internal */
  build(table) {
    return new PrimaryKey(table, this.columns, this.name);
  }
}
class PrimaryKey {
  constructor(table, columns, name) {
    this.table = table;
    this.columns = columns;
    this.name = name;
  }
  static [entityKind] = "PgPrimaryKey";
  columns;
  name;
  getName() {
    return this.name ?? `${this.table[PgTable.Symbol.Name]}_${this.columns.map((column) => column.name).join("_")}_pk`;
  }
}

function bindIfParam(value, column) {
  if (isDriverValueEncoder(column) && !isSQLWrapper(value) && !is(value, Param) && !is(value, Placeholder) && !is(value, Column) && !is(value, Table) && !is(value, View)) {
    return new Param(value, column);
  }
  return value;
}
const eq = (left, right) => {
  return sql`${left} = ${bindIfParam(right, left)}`;
};
const ne = (left, right) => {
  return sql`${left} <> ${bindIfParam(right, left)}`;
};
function and(...unfilteredConditions) {
  const conditions = unfilteredConditions.filter(
    (c) => c !== void 0
  );
  if (conditions.length === 0) {
    return void 0;
  }
  if (conditions.length === 1) {
    return new SQL(conditions);
  }
  return new SQL([
    new StringChunk("("),
    sql.join(conditions, new StringChunk(" and ")),
    new StringChunk(")")
  ]);
}
function or(...unfilteredConditions) {
  const conditions = unfilteredConditions.filter(
    (c) => c !== void 0
  );
  if (conditions.length === 0) {
    return void 0;
  }
  if (conditions.length === 1) {
    return new SQL(conditions);
  }
  return new SQL([
    new StringChunk("("),
    sql.join(conditions, new StringChunk(" or ")),
    new StringChunk(")")
  ]);
}
function not(condition) {
  return sql`not ${condition}`;
}
const gt = (left, right) => {
  return sql`${left} > ${bindIfParam(right, left)}`;
};
const gte = (left, right) => {
  return sql`${left} >= ${bindIfParam(right, left)}`;
};
const lt = (left, right) => {
  return sql`${left} < ${bindIfParam(right, left)}`;
};
const lte = (left, right) => {
  return sql`${left} <= ${bindIfParam(right, left)}`;
};
function inArray(column, values) {
  if (Array.isArray(values)) {
    if (values.length === 0) {
      return sql`false`;
    }
    return sql`${column} in ${values.map((v) => bindIfParam(v, column))}`;
  }
  return sql`${column} in ${bindIfParam(values, column)}`;
}
function notInArray(column, values) {
  if (Array.isArray(values)) {
    if (values.length === 0) {
      return sql`true`;
    }
    return sql`${column} not in ${values.map((v) => bindIfParam(v, column))}`;
  }
  return sql`${column} not in ${bindIfParam(values, column)}`;
}
function isNull(value) {
  return sql`${value} is null`;
}
function isNotNull(value) {
  return sql`${value} is not null`;
}
function exists(subquery) {
  return sql`exists ${subquery}`;
}
function notExists(subquery) {
  return sql`not exists ${subquery}`;
}
function between(column, min, max) {
  return sql`${column} between ${bindIfParam(min, column)} and ${bindIfParam(
    max,
    column
  )}`;
}
function notBetween(column, min, max) {
  return sql`${column} not between ${bindIfParam(
    min,
    column
  )} and ${bindIfParam(max, column)}`;
}
function like(column, value) {
  return sql`${column} like ${value}`;
}
function notLike(column, value) {
  return sql`${column} not like ${value}`;
}
function ilike(column, value) {
  return sql`${column} ilike ${value}`;
}
function notIlike(column, value) {
  return sql`${column} not ilike ${value}`;
}

function asc(column) {
  return sql`${column} asc`;
}
function desc(column) {
  return sql`${column} desc`;
}

class Relation {
  constructor(sourceTable, referencedTable, relationName) {
    this.sourceTable = sourceTable;
    this.referencedTable = referencedTable;
    this.relationName = relationName;
    this.referencedTableName = referencedTable[Table.Symbol.Name];
  }
  static [entityKind] = "Relation";
  referencedTableName;
  fieldName;
}
class Relations {
  constructor(table, config) {
    this.table = table;
    this.config = config;
  }
  static [entityKind] = "Relations";
}
class One extends Relation {
  constructor(sourceTable, referencedTable, config, isNullable) {
    super(sourceTable, referencedTable, config?.relationName);
    this.config = config;
    this.isNullable = isNullable;
  }
  static [entityKind] = "One";
  withFieldName(fieldName) {
    const relation = new One(
      this.sourceTable,
      this.referencedTable,
      this.config,
      this.isNullable
    );
    relation.fieldName = fieldName;
    return relation;
  }
}
class Many extends Relation {
  constructor(sourceTable, referencedTable, config) {
    super(sourceTable, referencedTable, config?.relationName);
    this.config = config;
  }
  static [entityKind] = "Many";
  withFieldName(fieldName) {
    const relation = new Many(
      this.sourceTable,
      this.referencedTable,
      this.config
    );
    relation.fieldName = fieldName;
    return relation;
  }
}
function getOperators() {
  return {
    and,
    between,
    eq,
    exists,
    gt,
    gte,
    ilike,
    inArray,
    isNull,
    isNotNull,
    like,
    lt,
    lte,
    ne,
    not,
    notBetween,
    notExists,
    notLike,
    notIlike,
    notInArray,
    or,
    sql
  };
}
function getOrderByOperators() {
  return {
    sql,
    asc,
    desc
  };
}
function extractTablesRelationalConfig(schema, configHelpers) {
  if (Object.keys(schema).length === 1 && "default" in schema && !is(schema["default"], Table)) {
    schema = schema["default"];
  }
  const tableNamesMap = {};
  const relationsBuffer = {};
  const tablesConfig = {};
  for (const [key, value] of Object.entries(schema)) {
    if (is(value, Table)) {
      const dbName = getTableUniqueName(value);
      const bufferedRelations = relationsBuffer[dbName];
      tableNamesMap[dbName] = key;
      tablesConfig[key] = {
        tsName: key,
        dbName: value[Table.Symbol.Name],
        schema: value[Table.Symbol.Schema],
        columns: value[Table.Symbol.Columns],
        relations: bufferedRelations?.relations ?? {},
        primaryKey: bufferedRelations?.primaryKey ?? []
      };
      for (const column of Object.values(
        value[Table.Symbol.Columns]
      )) {
        if (column.primary) {
          tablesConfig[key].primaryKey.push(column);
        }
      }
      const extraConfig = value[Table.Symbol.ExtraConfigBuilder]?.(value[Table.Symbol.ExtraConfigColumns]);
      if (extraConfig) {
        for (const configEntry of Object.values(extraConfig)) {
          if (is(configEntry, PrimaryKeyBuilder)) {
            tablesConfig[key].primaryKey.push(...configEntry.columns);
          }
        }
      }
    } else if (is(value, Relations)) {
      const dbName = getTableUniqueName(value.table);
      const tableName = tableNamesMap[dbName];
      const relations2 = value.config(
        configHelpers(value.table)
      );
      let primaryKey;
      for (const [relationName, relation] of Object.entries(relations2)) {
        if (tableName) {
          const tableConfig = tablesConfig[tableName];
          tableConfig.relations[relationName] = relation;
        } else {
          if (!(dbName in relationsBuffer)) {
            relationsBuffer[dbName] = {
              relations: {},
              primaryKey
            };
          }
          relationsBuffer[dbName].relations[relationName] = relation;
        }
      }
    }
  }
  return { tables: tablesConfig, tableNamesMap };
}
function createOne(sourceTable) {
  return function one(table, config) {
    return new One(
      sourceTable,
      table,
      config,
      config?.fields.reduce((res, f) => res && f.notNull, true) ?? false
    );
  };
}
function createMany(sourceTable) {
  return function many(referencedTable, config) {
    return new Many(sourceTable, referencedTable, config);
  };
}
function normalizeRelation(schema, tableNamesMap, relation) {
  if (is(relation, One) && relation.config) {
    return {
      fields: relation.config.fields,
      references: relation.config.references
    };
  }
  const referencedTableTsName = tableNamesMap[getTableUniqueName(relation.referencedTable)];
  if (!referencedTableTsName) {
    throw new Error(
      `Table "${relation.referencedTable[Table.Symbol.Name]}" not found in schema`
    );
  }
  const referencedTableConfig = schema[referencedTableTsName];
  if (!referencedTableConfig) {
    throw new Error(`Table "${referencedTableTsName}" not found in schema`);
  }
  const sourceTable = relation.sourceTable;
  const sourceTableTsName = tableNamesMap[getTableUniqueName(sourceTable)];
  if (!sourceTableTsName) {
    throw new Error(
      `Table "${sourceTable[Table.Symbol.Name]}" not found in schema`
    );
  }
  const reverseRelations = [];
  for (const referencedTableRelation of Object.values(
    referencedTableConfig.relations
  )) {
    if (relation.relationName && relation !== referencedTableRelation && referencedTableRelation.relationName === relation.relationName || !relation.relationName && referencedTableRelation.referencedTable === relation.sourceTable) {
      reverseRelations.push(referencedTableRelation);
    }
  }
  if (reverseRelations.length > 1) {
    throw relation.relationName ? new Error(
      `There are multiple relations with name "${relation.relationName}" in table "${referencedTableTsName}"`
    ) : new Error(
      `There are multiple relations between "${referencedTableTsName}" and "${relation.sourceTable[Table.Symbol.Name]}". Please specify relation name`
    );
  }
  if (reverseRelations[0] && is(reverseRelations[0], One) && reverseRelations[0].config) {
    return {
      fields: reverseRelations[0].config.references,
      references: reverseRelations[0].config.fields
    };
  }
  throw new Error(
    `There is not enough information to infer relation "${sourceTableTsName}.${relation.fieldName}"`
  );
}
function createTableRelationsHelpers(sourceTable) {
  return {
    one: createOne(sourceTable),
    many: createMany(sourceTable)
  };
}
function mapRelationalRow(tablesConfig, tableConfig, row, buildQueryResultSelection, mapColumnValue = (value) => value) {
  const result = {};
  for (const [
    selectionItemIndex,
    selectionItem
  ] of buildQueryResultSelection.entries()) {
    if (selectionItem.isJson) {
      const relation = tableConfig.relations[selectionItem.tsKey];
      const rawSubRows = row[selectionItemIndex];
      const subRows = typeof rawSubRows === "string" ? JSON.parse(rawSubRows) : rawSubRows;
      result[selectionItem.tsKey] = is(relation, One) ? subRows && mapRelationalRow(
        tablesConfig,
        tablesConfig[selectionItem.relationTableTsKey],
        subRows,
        selectionItem.selection,
        mapColumnValue
      ) : subRows.map(
        (subRow) => mapRelationalRow(
          tablesConfig,
          tablesConfig[selectionItem.relationTableTsKey],
          subRow,
          selectionItem.selection,
          mapColumnValue
        )
      );
    } else {
      const value = mapColumnValue(row[selectionItemIndex]);
      const field = selectionItem.field;
      let decoder;
      if (is(field, Column)) {
        decoder = field;
      } else if (is(field, SQL)) {
        decoder = field.decoder;
      } else {
        decoder = field.sql.decoder;
      }
      result[selectionItem.tsKey] = value === null ? null : decoder.mapFromDriverValue(value);
    }
  }
  return result;
}

class ColumnAliasProxyHandler {
  constructor(table) {
    this.table = table;
  }
  static [entityKind] = "ColumnAliasProxyHandler";
  get(columnObj, prop) {
    if (prop === "table") {
      return this.table;
    }
    return columnObj[prop];
  }
}
class TableAliasProxyHandler {
  constructor(alias, replaceOriginalName) {
    this.alias = alias;
    this.replaceOriginalName = replaceOriginalName;
  }
  static [entityKind] = "TableAliasProxyHandler";
  get(target, prop) {
    if (prop === Table.Symbol.IsAlias) {
      return true;
    }
    if (prop === Table.Symbol.Name) {
      return this.alias;
    }
    if (this.replaceOriginalName && prop === Table.Symbol.OriginalName) {
      return this.alias;
    }
    if (prop === ViewBaseConfig) {
      return {
        ...target[ViewBaseConfig],
        name: this.alias,
        isAlias: true
      };
    }
    if (prop === Table.Symbol.Columns) {
      const columns = target[Table.Symbol.Columns];
      if (!columns) {
        return columns;
      }
      const proxiedColumns = {};
      Object.keys(columns).map((key) => {
        proxiedColumns[key] = new Proxy(
          columns[key],
          new ColumnAliasProxyHandler(new Proxy(target, this))
        );
      });
      return proxiedColumns;
    }
    const value = target[prop];
    if (is(value, Column)) {
      return new Proxy(value, new ColumnAliasProxyHandler(new Proxy(target, this)));
    }
    return value;
  }
}
function aliasedTable(table, tableAlias) {
  return new Proxy(table, new TableAliasProxyHandler(tableAlias, false));
}
function aliasedTableColumn(column, tableAlias) {
  return new Proxy(
    column,
    new ColumnAliasProxyHandler(new Proxy(column.table, new TableAliasProxyHandler(tableAlias, false)))
  );
}
function mapColumnsInAliasedSQLToAlias(query, alias) {
  return new SQL.Aliased(mapColumnsInSQLToAlias(query.sql, alias), query.fieldAlias);
}
function mapColumnsInSQLToAlias(query, alias) {
  return sql.join(query.queryChunks.map((c) => {
    if (is(c, Column)) {
      return aliasedTableColumn(c, alias);
    }
    if (is(c, SQL)) {
      return mapColumnsInSQLToAlias(c, alias);
    }
    if (is(c, SQL.Aliased)) {
      return mapColumnsInAliasedSQLToAlias(c, alias);
    }
    return c;
  }));
}

class SelectionProxyHandler {
  static [entityKind] = "SelectionProxyHandler";
  config;
  constructor(config) {
    this.config = { ...config };
  }
  get(subquery, prop) {
    if (prop === "_") {
      return {
        ...subquery["_"],
        selectedFields: new Proxy(
          subquery._.selectedFields,
          this
        )
      };
    }
    if (prop === ViewBaseConfig) {
      return {
        ...subquery[ViewBaseConfig],
        selectedFields: new Proxy(
          subquery[ViewBaseConfig].selectedFields,
          this
        )
      };
    }
    if (typeof prop === "symbol") {
      return subquery[prop];
    }
    const columns = is(subquery, Subquery) ? subquery._.selectedFields : is(subquery, View) ? subquery[ViewBaseConfig].selectedFields : subquery;
    const value = columns[prop];
    if (is(value, SQL.Aliased)) {
      if (this.config.sqlAliasedBehavior === "sql" && !value.isSelectionField) {
        return value.sql;
      }
      const newValue = value.clone();
      newValue.isSelectionField = true;
      return newValue;
    }
    if (is(value, SQL)) {
      if (this.config.sqlBehavior === "sql") {
        return value;
      }
      throw new Error(
        `You tried to reference "${prop}" field from a subquery, which is a raw SQL field, but it doesn't have an alias declared. Please add an alias to the field using ".as('alias')" method.`
      );
    }
    if (is(value, Column)) {
      if (this.config.alias) {
        return new Proxy(
          value,
          new ColumnAliasProxyHandler(
            new Proxy(
              value.table,
              new TableAliasProxyHandler(this.config.alias, this.config.replaceOriginalName ?? false)
            )
          )
        );
      }
      return value;
    }
    if (typeof value !== "object" || value === null) {
      return value;
    }
    return new Proxy(value, new SelectionProxyHandler(this.config));
  }
}

class QueryPromise {
  static [entityKind] = "QueryPromise";
  [Symbol.toStringTag] = "QueryPromise";
  catch(onRejected) {
    return this.then(void 0, onRejected);
  }
  finally(onFinally) {
    return this.then(
      (value) => {
        onFinally?.();
        return value;
      },
      (reason) => {
        onFinally?.();
        throw reason;
      }
    );
  }
  then(onFulfilled, onRejected) {
    return this.execute().then(onFulfilled, onRejected);
  }
}

class ForeignKeyBuilder {
  static [entityKind] = "SQLiteForeignKeyBuilder";
  /** @internal */
  reference;
  /** @internal */
  _onUpdate;
  /** @internal */
  _onDelete;
  constructor(config, actions) {
    this.reference = () => {
      const { name, columns, foreignColumns } = config();
      return { name, columns, foreignTable: foreignColumns[0].table, foreignColumns };
    };
    if (actions) {
      this._onUpdate = actions.onUpdate;
      this._onDelete = actions.onDelete;
    }
  }
  onUpdate(action) {
    this._onUpdate = action;
    return this;
  }
  onDelete(action) {
    this._onDelete = action;
    return this;
  }
  /** @internal */
  build(table) {
    return new ForeignKey(table, this);
  }
}
class ForeignKey {
  constructor(table, builder) {
    this.table = table;
    this.reference = builder.reference;
    this.onUpdate = builder._onUpdate;
    this.onDelete = builder._onDelete;
  }
  static [entityKind] = "SQLiteForeignKey";
  reference;
  onUpdate;
  onDelete;
  getName() {
    const { name, columns, foreignColumns } = this.reference();
    const columnNames = columns.map((column) => column.name);
    const foreignColumnNames = foreignColumns.map((column) => column.name);
    const chunks = [
      this.table[TableName],
      ...columnNames,
      foreignColumns[0].table[TableName],
      ...foreignColumnNames
    ];
    return name ?? `${chunks.join("_")}_fk`;
  }
}

function uniqueKeyName(table, columns) {
  return `${table[TableName]}_${columns.join("_")}_unique`;
}

class SQLiteColumnBuilder extends ColumnBuilder {
  static [entityKind] = "SQLiteColumnBuilder";
  foreignKeyConfigs = [];
  references(ref, actions = {}) {
    this.foreignKeyConfigs.push({ ref, actions });
    return this;
  }
  unique(name) {
    this.config.isUnique = true;
    this.config.uniqueName = name;
    return this;
  }
  generatedAlwaysAs(as, config) {
    this.config.generated = {
      as,
      type: "always",
      mode: config?.mode ?? "virtual"
    };
    return this;
  }
  /** @internal */
  buildForeignKeys(column, table) {
    return this.foreignKeyConfigs.map(({ ref, actions }) => {
      return ((ref2, actions2) => {
        const builder = new ForeignKeyBuilder(() => {
          const foreignColumn = ref2();
          return { columns: [column], foreignColumns: [foreignColumn] };
        });
        if (actions2.onUpdate) {
          builder.onUpdate(actions2.onUpdate);
        }
        if (actions2.onDelete) {
          builder.onDelete(actions2.onDelete);
        }
        return builder.build(table);
      })(ref, actions);
    });
  }
}
class SQLiteColumn extends Column {
  constructor(table, config) {
    if (!config.uniqueName) {
      config.uniqueName = uniqueKeyName(table, [config.name]);
    }
    super(table, config);
    this.table = table;
  }
  static [entityKind] = "SQLiteColumn";
}

class SQLiteBigIntBuilder extends SQLiteColumnBuilder {
  static [entityKind] = "SQLiteBigIntBuilder";
  constructor(name) {
    super(name, "bigint", "SQLiteBigInt");
  }
  /** @internal */
  build(table) {
    return new SQLiteBigInt(table, this.config);
  }
}
class SQLiteBigInt extends SQLiteColumn {
  static [entityKind] = "SQLiteBigInt";
  getSQLType() {
    return "blob";
  }
  mapFromDriverValue(value) {
    if (typeof Buffer !== "undefined" && Buffer.from) {
      const buf = Buffer.isBuffer(value) ? value : value instanceof ArrayBuffer ? Buffer.from(value) : value.buffer ? Buffer.from(value.buffer, value.byteOffset, value.byteLength) : Buffer.from(value);
      return BigInt(buf.toString("utf8"));
    }
    return BigInt(textDecoder.decode(value));
  }
  mapToDriverValue(value) {
    return Buffer.from(value.toString());
  }
}
class SQLiteBlobJsonBuilder extends SQLiteColumnBuilder {
  static [entityKind] = "SQLiteBlobJsonBuilder";
  constructor(name) {
    super(name, "json", "SQLiteBlobJson");
  }
  /** @internal */
  build(table) {
    return new SQLiteBlobJson(
      table,
      this.config
    );
  }
}
class SQLiteBlobJson extends SQLiteColumn {
  static [entityKind] = "SQLiteBlobJson";
  getSQLType() {
    return "blob";
  }
  mapFromDriverValue(value) {
    if (typeof Buffer !== "undefined" && Buffer.from) {
      const buf = Buffer.isBuffer(value) ? value : value instanceof ArrayBuffer ? Buffer.from(value) : value.buffer ? Buffer.from(value.buffer, value.byteOffset, value.byteLength) : Buffer.from(value);
      return JSON.parse(buf.toString("utf8"));
    }
    return JSON.parse(textDecoder.decode(value));
  }
  mapToDriverValue(value) {
    return Buffer.from(JSON.stringify(value));
  }
}
class SQLiteBlobBufferBuilder extends SQLiteColumnBuilder {
  static [entityKind] = "SQLiteBlobBufferBuilder";
  constructor(name) {
    super(name, "buffer", "SQLiteBlobBuffer");
  }
  /** @internal */
  build(table) {
    return new SQLiteBlobBuffer(table, this.config);
  }
}
class SQLiteBlobBuffer extends SQLiteColumn {
  static [entityKind] = "SQLiteBlobBuffer";
  mapFromDriverValue(value) {
    if (Buffer.isBuffer(value)) {
      return value;
    }
    return Buffer.from(value);
  }
  getSQLType() {
    return "blob";
  }
}
function blob(a, b) {
  const { name, config } = getColumnNameAndConfig(a, b);
  if (config?.mode === "json") {
    return new SQLiteBlobJsonBuilder(name);
  }
  if (config?.mode === "bigint") {
    return new SQLiteBigIntBuilder(name);
  }
  return new SQLiteBlobBufferBuilder(name);
}

class SQLiteCustomColumnBuilder extends SQLiteColumnBuilder {
  static [entityKind] = "SQLiteCustomColumnBuilder";
  constructor(name, fieldConfig, customTypeParams) {
    super(name, "custom", "SQLiteCustomColumn");
    this.config.fieldConfig = fieldConfig;
    this.config.customTypeParams = customTypeParams;
  }
  /** @internal */
  build(table) {
    return new SQLiteCustomColumn(
      table,
      this.config
    );
  }
}
class SQLiteCustomColumn extends SQLiteColumn {
  static [entityKind] = "SQLiteCustomColumn";
  sqlName;
  mapTo;
  mapFrom;
  constructor(table, config) {
    super(table, config);
    this.sqlName = config.customTypeParams.dataType(config.fieldConfig);
    this.mapTo = config.customTypeParams.toDriver;
    this.mapFrom = config.customTypeParams.fromDriver;
  }
  getSQLType() {
    return this.sqlName;
  }
  mapFromDriverValue(value) {
    return typeof this.mapFrom === "function" ? this.mapFrom(value) : value;
  }
  mapToDriverValue(value) {
    return typeof this.mapTo === "function" ? this.mapTo(value) : value;
  }
}
function customType(customTypeParams) {
  return (a, b) => {
    const { name, config } = getColumnNameAndConfig(a, b);
    return new SQLiteCustomColumnBuilder(
      name,
      config,
      customTypeParams
    );
  };
}

class SQLiteBaseIntegerBuilder extends SQLiteColumnBuilder {
  static [entityKind] = "SQLiteBaseIntegerBuilder";
  constructor(name, dataType, columnType) {
    super(name, dataType, columnType);
    this.config.autoIncrement = false;
  }
  primaryKey(config) {
    if (config?.autoIncrement) {
      this.config.autoIncrement = true;
    }
    this.config.hasDefault = true;
    return super.primaryKey();
  }
}
class SQLiteBaseInteger extends SQLiteColumn {
  static [entityKind] = "SQLiteBaseInteger";
  autoIncrement = this.config.autoIncrement;
  getSQLType() {
    return "integer";
  }
}
class SQLiteIntegerBuilder extends SQLiteBaseIntegerBuilder {
  static [entityKind] = "SQLiteIntegerBuilder";
  constructor(name) {
    super(name, "number", "SQLiteInteger");
  }
  build(table) {
    return new SQLiteInteger(
      table,
      this.config
    );
  }
}
class SQLiteInteger extends SQLiteBaseInteger {
  static [entityKind] = "SQLiteInteger";
}
class SQLiteTimestampBuilder extends SQLiteBaseIntegerBuilder {
  static [entityKind] = "SQLiteTimestampBuilder";
  constructor(name, mode) {
    super(name, "date", "SQLiteTimestamp");
    this.config.mode = mode;
  }
  /**
   * @deprecated Use `default()` with your own expression instead.
   *
   * Adds `DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer))` to the column, which is the current epoch timestamp in milliseconds.
   */
  defaultNow() {
    return this.default(sql`(cast((julianday('now') - 2440587.5)*86400000 as integer))`);
  }
  build(table) {
    return new SQLiteTimestamp(
      table,
      this.config
    );
  }
}
class SQLiteTimestamp extends SQLiteBaseInteger {
  static [entityKind] = "SQLiteTimestamp";
  mode = this.config.mode;
  mapFromDriverValue(value) {
    if (this.config.mode === "timestamp") {
      return new Date(value * 1e3);
    }
    return new Date(value);
  }
  mapToDriverValue(value) {
    const unix = value.getTime();
    if (this.config.mode === "timestamp") {
      return Math.floor(unix / 1e3);
    }
    return unix;
  }
}
class SQLiteBooleanBuilder extends SQLiteBaseIntegerBuilder {
  static [entityKind] = "SQLiteBooleanBuilder";
  constructor(name, mode) {
    super(name, "boolean", "SQLiteBoolean");
    this.config.mode = mode;
  }
  build(table) {
    return new SQLiteBoolean(
      table,
      this.config
    );
  }
}
class SQLiteBoolean extends SQLiteBaseInteger {
  static [entityKind] = "SQLiteBoolean";
  mode = this.config.mode;
  mapFromDriverValue(value) {
    return Number(value) === 1;
  }
  mapToDriverValue(value) {
    return value ? 1 : 0;
  }
}
function integer(a, b) {
  const { name, config } = getColumnNameAndConfig(a, b);
  if (config?.mode === "timestamp" || config?.mode === "timestamp_ms") {
    return new SQLiteTimestampBuilder(name, config.mode);
  }
  if (config?.mode === "boolean") {
    return new SQLiteBooleanBuilder(name, config.mode);
  }
  return new SQLiteIntegerBuilder(name);
}

class SQLiteNumericBuilder extends SQLiteColumnBuilder {
  static [entityKind] = "SQLiteNumericBuilder";
  constructor(name) {
    super(name, "string", "SQLiteNumeric");
  }
  /** @internal */
  build(table) {
    return new SQLiteNumeric(
      table,
      this.config
    );
  }
}
class SQLiteNumeric extends SQLiteColumn {
  static [entityKind] = "SQLiteNumeric";
  mapFromDriverValue(value) {
    if (typeof value === "string") return value;
    return String(value);
  }
  getSQLType() {
    return "numeric";
  }
}
class SQLiteNumericNumberBuilder extends SQLiteColumnBuilder {
  static [entityKind] = "SQLiteNumericNumberBuilder";
  constructor(name) {
    super(name, "number", "SQLiteNumericNumber");
  }
  /** @internal */
  build(table) {
    return new SQLiteNumericNumber(
      table,
      this.config
    );
  }
}
class SQLiteNumericNumber extends SQLiteColumn {
  static [entityKind] = "SQLiteNumericNumber";
  mapFromDriverValue(value) {
    if (typeof value === "number") return value;
    return Number(value);
  }
  mapToDriverValue = String;
  getSQLType() {
    return "numeric";
  }
}
class SQLiteNumericBigIntBuilder extends SQLiteColumnBuilder {
  static [entityKind] = "SQLiteNumericBigIntBuilder";
  constructor(name) {
    super(name, "bigint", "SQLiteNumericBigInt");
  }
  /** @internal */
  build(table) {
    return new SQLiteNumericBigInt(
      table,
      this.config
    );
  }
}
class SQLiteNumericBigInt extends SQLiteColumn {
  static [entityKind] = "SQLiteNumericBigInt";
  mapFromDriverValue = BigInt;
  mapToDriverValue = String;
  getSQLType() {
    return "numeric";
  }
}
function numeric(a, b) {
  const { name, config } = getColumnNameAndConfig(a, b);
  const mode = config?.mode;
  return mode === "number" ? new SQLiteNumericNumberBuilder(name) : mode === "bigint" ? new SQLiteNumericBigIntBuilder(name) : new SQLiteNumericBuilder(name);
}

class SQLiteRealBuilder extends SQLiteColumnBuilder {
  static [entityKind] = "SQLiteRealBuilder";
  constructor(name) {
    super(name, "number", "SQLiteReal");
  }
  /** @internal */
  build(table) {
    return new SQLiteReal(table, this.config);
  }
}
class SQLiteReal extends SQLiteColumn {
  static [entityKind] = "SQLiteReal";
  getSQLType() {
    return "real";
  }
}
function real(name) {
  return new SQLiteRealBuilder(name ?? "");
}

class SQLiteTextBuilder extends SQLiteColumnBuilder {
  static [entityKind] = "SQLiteTextBuilder";
  constructor(name, config) {
    super(name, "string", "SQLiteText");
    this.config.enumValues = config.enum;
    this.config.length = config.length;
  }
  /** @internal */
  build(table) {
    return new SQLiteText(
      table,
      this.config
    );
  }
}
class SQLiteText extends SQLiteColumn {
  static [entityKind] = "SQLiteText";
  enumValues = this.config.enumValues;
  length = this.config.length;
  constructor(table, config) {
    super(table, config);
  }
  getSQLType() {
    return `text${this.config.length ? `(${this.config.length})` : ""}`;
  }
}
class SQLiteTextJsonBuilder extends SQLiteColumnBuilder {
  static [entityKind] = "SQLiteTextJsonBuilder";
  constructor(name) {
    super(name, "json", "SQLiteTextJson");
  }
  /** @internal */
  build(table) {
    return new SQLiteTextJson(
      table,
      this.config
    );
  }
}
class SQLiteTextJson extends SQLiteColumn {
  static [entityKind] = "SQLiteTextJson";
  getSQLType() {
    return "text";
  }
  mapFromDriverValue(value) {
    return JSON.parse(value);
  }
  mapToDriverValue(value) {
    return JSON.stringify(value);
  }
}
function text(a, b = {}) {
  const { name, config } = getColumnNameAndConfig(a, b);
  if (config.mode === "json") {
    return new SQLiteTextJsonBuilder(name);
  }
  return new SQLiteTextBuilder(name, config);
}

function getSQLiteColumnBuilders() {
  return {
    blob,
    customType,
    integer,
    numeric,
    real,
    text
  };
}

const InlineForeignKeys = Symbol.for("drizzle:SQLiteInlineForeignKeys");
class SQLiteTable extends Table {
  static [entityKind] = "SQLiteTable";
  /** @internal */
  static Symbol = Object.assign({}, Table.Symbol, {
    InlineForeignKeys
  });
  /** @internal */
  [Table.Symbol.Columns];
  /** @internal */
  [InlineForeignKeys] = [];
  /** @internal */
  [Table.Symbol.ExtraConfigBuilder] = void 0;
}
function sqliteTableBase(name, columns, extraConfig, schema, baseName = name) {
  const rawTable = new SQLiteTable(name, schema, baseName);
  const parsedColumns = typeof columns === "function" ? columns(getSQLiteColumnBuilders()) : columns;
  const builtColumns = Object.fromEntries(
    Object.entries(parsedColumns).map(([name2, colBuilderBase]) => {
      const colBuilder = colBuilderBase;
      colBuilder.setName(name2);
      const column = colBuilder.build(rawTable);
      rawTable[InlineForeignKeys].push(...colBuilder.buildForeignKeys(column, rawTable));
      return [name2, column];
    })
  );
  const table = Object.assign(rawTable, builtColumns);
  table[Table.Symbol.Columns] = builtColumns;
  table[Table.Symbol.ExtraConfigColumns] = builtColumns;
  if (extraConfig) {
    table[SQLiteTable.Symbol.ExtraConfigBuilder] = extraConfig;
  }
  return table;
}
const sqliteTable = (name, columns, extraConfig) => {
  return sqliteTableBase(name, columns, extraConfig);
};

class IndexBuilderOn {
  constructor(name, unique) {
    this.name = name;
    this.unique = unique;
  }
  static [entityKind] = "SQLiteIndexBuilderOn";
  on(...columns) {
    return new IndexBuilder(this.name, columns, this.unique);
  }
}
class IndexBuilder {
  static [entityKind] = "SQLiteIndexBuilder";
  /** @internal */
  config;
  constructor(name, columns, unique) {
    this.config = {
      name,
      columns,
      unique,
      where: void 0
    };
  }
  /**
   * Condition for partial index.
   */
  where(condition) {
    this.config.where = condition;
    return this;
  }
  /** @internal */
  build(table) {
    return new Index(this.config, table);
  }
}
class Index {
  static [entityKind] = "SQLiteIndex";
  config;
  constructor(config, table) {
    this.config = { ...config, table };
  }
}
function index(name) {
  return new IndexBuilderOn(name, false);
}

function extractUsedTable(table) {
  if (is(table, SQLiteTable)) {
    return [`${table[Table.Symbol.BaseName]}`];
  }
  if (is(table, Subquery)) {
    return table._.usedTables ?? [];
  }
  if (is(table, SQL)) {
    return table.usedTables ?? [];
  }
  return [];
}

class SQLiteDeleteBase extends QueryPromise {
  constructor(table, session, dialect, withList) {
    super();
    this.table = table;
    this.session = session;
    this.dialect = dialect;
    this.config = { table, withList };
  }
  static [entityKind] = "SQLiteDelete";
  /** @internal */
  config;
  /**
   * Adds a `where` clause to the query.
   *
   * Calling this method will delete only those rows that fulfill a specified condition.
   *
   * See docs: {@link https://orm.drizzle.team/docs/delete}
   *
   * @param where the `where` clause.
   *
   * @example
   * You can use conditional operators and `sql function` to filter the rows to be deleted.
   *
   * ```ts
   * // Delete all cars with green color
   * db.delete(cars).where(eq(cars.color, 'green'));
   * // or
   * db.delete(cars).where(sql`${cars.color} = 'green'`)
   * ```
   *
   * You can logically combine conditional operators with `and()` and `or()` operators:
   *
   * ```ts
   * // Delete all BMW cars with a green color
   * db.delete(cars).where(and(eq(cars.color, 'green'), eq(cars.brand, 'BMW')));
   *
   * // Delete all cars with the green or blue color
   * db.delete(cars).where(or(eq(cars.color, 'green'), eq(cars.color, 'blue')));
   * ```
   */
  where(where) {
    this.config.where = where;
    return this;
  }
  orderBy(...columns) {
    if (typeof columns[0] === "function") {
      const orderBy = columns[0](
        new Proxy(
          this.config.table[Table.Symbol.Columns],
          new SelectionProxyHandler({ sqlAliasedBehavior: "alias", sqlBehavior: "sql" })
        )
      );
      const orderByArray = Array.isArray(orderBy) ? orderBy : [orderBy];
      this.config.orderBy = orderByArray;
    } else {
      const orderByArray = columns;
      this.config.orderBy = orderByArray;
    }
    return this;
  }
  limit(limit) {
    this.config.limit = limit;
    return this;
  }
  returning(fields = this.table[SQLiteTable.Symbol.Columns]) {
    this.config.returning = orderSelectedFields(fields);
    return this;
  }
  /** @internal */
  getSQL() {
    return this.dialect.buildDeleteQuery(this.config);
  }
  toSQL() {
    const { typings: _typings, ...rest } = this.dialect.sqlToQuery(this.getSQL());
    return rest;
  }
  /** @internal */
  _prepare(isOneTimeQuery = true) {
    return this.session[isOneTimeQuery ? "prepareOneTimeQuery" : "prepareQuery"](
      this.dialect.sqlToQuery(this.getSQL()),
      this.config.returning,
      this.config.returning ? "all" : "run",
      true,
      void 0,
      {
        type: "delete",
        tables: extractUsedTable(this.config.table)
      }
    );
  }
  prepare() {
    return this._prepare(false);
  }
  run = (placeholderValues) => {
    return this._prepare().run(placeholderValues);
  };
  all = (placeholderValues) => {
    return this._prepare().all(placeholderValues);
  };
  get = (placeholderValues) => {
    return this._prepare().get(placeholderValues);
  };
  values = (placeholderValues) => {
    return this._prepare().values(placeholderValues);
  };
  async execute(placeholderValues) {
    return this._prepare().execute(placeholderValues);
  }
  $dynamic() {
    return this;
  }
}

function toSnakeCase(input) {
  const words = input.replace(/['\u2019]/g, "").match(/[\da-z]+|[A-Z]+(?![a-z])|[A-Z][\da-z]+/g) ?? [];
  return words.map((word) => word.toLowerCase()).join("_");
}
function toCamelCase(input) {
  const words = input.replace(/['\u2019]/g, "").match(/[\da-z]+|[A-Z]+(?![a-z])|[A-Z][\da-z]+/g) ?? [];
  return words.reduce((acc, word, i) => {
    const formattedWord = i === 0 ? word.toLowerCase() : `${word[0].toUpperCase()}${word.slice(1)}`;
    return acc + formattedWord;
  }, "");
}
function noopCase(input) {
  return input;
}
class CasingCache {
  static [entityKind] = "CasingCache";
  /** @internal */
  cache = {};
  cachedTables = {};
  convert;
  constructor(casing) {
    this.convert = casing === "snake_case" ? toSnakeCase : casing === "camelCase" ? toCamelCase : noopCase;
  }
  getColumnCasing(column) {
    if (!column.keyAsName) return column.name;
    const schema = column.table[Table.Symbol.Schema] ?? "public";
    const tableName = column.table[Table.Symbol.OriginalName];
    const key = `${schema}.${tableName}.${column.name}`;
    if (!this.cache[key]) {
      this.cacheTable(column.table);
    }
    return this.cache[key];
  }
  cacheTable(table) {
    const schema = table[Table.Symbol.Schema] ?? "public";
    const tableName = table[Table.Symbol.OriginalName];
    const tableKey = `${schema}.${tableName}`;
    if (!this.cachedTables[tableKey]) {
      for (const column of Object.values(table[Table.Symbol.Columns])) {
        const columnKey = `${tableKey}.${column.name}`;
        this.cache[columnKey] = this.convert(column.name);
      }
      this.cachedTables[tableKey] = true;
    }
  }
  clearCache() {
    this.cache = {};
    this.cachedTables = {};
  }
}

class DrizzleError extends Error {
  static [entityKind] = "DrizzleError";
  constructor({ message, cause }) {
    super(message);
    this.name = "DrizzleError";
    this.cause = cause;
  }
}
class DrizzleQueryError extends Error {
  constructor(query, params, cause) {
    super(`Failed query: ${query}
params: ${params}`);
    this.query = query;
    this.params = params;
    this.cause = cause;
    Error.captureStackTrace(this, DrizzleQueryError);
    if (cause) this.cause = cause;
  }
}
class TransactionRollbackError extends DrizzleError {
  static [entityKind] = "TransactionRollbackError";
  constructor() {
    super({ message: "Rollback" });
  }
}

class SQLiteViewBase extends View {
  static [entityKind] = "SQLiteViewBase";
}

class SQLiteDialect {
  static [entityKind] = "SQLiteDialect";
  /** @internal */
  casing;
  constructor(config) {
    this.casing = new CasingCache(config?.casing);
  }
  escapeName(name) {
    return `"${name}"`;
  }
  escapeParam(_num) {
    return "?";
  }
  escapeString(str) {
    return `'${str.replace(/'/g, "''")}'`;
  }
  buildWithCTE(queries) {
    if (!queries?.length) return void 0;
    const withSqlChunks = [sql`with `];
    for (const [i, w] of queries.entries()) {
      withSqlChunks.push(sql`${sql.identifier(w._.alias)} as (${w._.sql})`);
      if (i < queries.length - 1) {
        withSqlChunks.push(sql`, `);
      }
    }
    withSqlChunks.push(sql` `);
    return sql.join(withSqlChunks);
  }
  buildDeleteQuery({ table, where, returning, withList, limit, orderBy }) {
    const withSql = this.buildWithCTE(withList);
    const returningSql = returning ? sql` returning ${this.buildSelection(returning, { isSingleTable: true })}` : void 0;
    const whereSql = where ? sql` where ${where}` : void 0;
    const orderBySql = this.buildOrderBy(orderBy);
    const limitSql = this.buildLimit(limit);
    return sql`${withSql}delete from ${table}${whereSql}${returningSql}${orderBySql}${limitSql}`;
  }
  buildUpdateSet(table, set) {
    const tableColumns = table[Table.Symbol.Columns];
    const columnNames = Object.keys(tableColumns).filter(
      (colName) => set[colName] !== void 0 || tableColumns[colName]?.onUpdateFn !== void 0
    );
    const setSize = columnNames.length;
    return sql.join(columnNames.flatMap((colName, i) => {
      const col = tableColumns[colName];
      const value = set[colName] ?? sql.param(col.onUpdateFn(), col);
      const res = sql`${sql.identifier(this.casing.getColumnCasing(col))} = ${value}`;
      if (i < setSize - 1) {
        return [res, sql.raw(", ")];
      }
      return [res];
    }));
  }
  buildUpdateQuery({ table, set, where, returning, withList, joins, from, limit, orderBy }) {
    const withSql = this.buildWithCTE(withList);
    const setSql = this.buildUpdateSet(table, set);
    const fromSql = from && sql.join([sql.raw(" from "), this.buildFromTable(from)]);
    const joinsSql = this.buildJoins(joins);
    const returningSql = returning ? sql` returning ${this.buildSelection(returning, { isSingleTable: true })}` : void 0;
    const whereSql = where ? sql` where ${where}` : void 0;
    const orderBySql = this.buildOrderBy(orderBy);
    const limitSql = this.buildLimit(limit);
    return sql`${withSql}update ${table} set ${setSql}${fromSql}${joinsSql}${whereSql}${returningSql}${orderBySql}${limitSql}`;
  }
  /**
   * Builds selection SQL with provided fields/expressions
   *
   * Examples:
   *
   * `select <selection> from`
   *
   * `insert ... returning <selection>`
   *
   * If `isSingleTable` is true, then columns won't be prefixed with table name
   */
  buildSelection(fields, { isSingleTable = false } = {}) {
    const columnsLen = fields.length;
    const chunks = fields.flatMap(({ field }, i) => {
      const chunk = [];
      if (is(field, SQL.Aliased) && field.isSelectionField) {
        chunk.push(sql.identifier(field.fieldAlias));
      } else if (is(field, SQL.Aliased) || is(field, SQL)) {
        const query = is(field, SQL.Aliased) ? field.sql : field;
        if (isSingleTable) {
          chunk.push(
            new SQL(
              query.queryChunks.map((c) => {
                if (is(c, Column)) {
                  return sql.identifier(this.casing.getColumnCasing(c));
                }
                return c;
              })
            )
          );
        } else {
          chunk.push(query);
        }
        if (is(field, SQL.Aliased)) {
          chunk.push(sql` as ${sql.identifier(field.fieldAlias)}`);
        }
      } else if (is(field, Column)) {
        const tableName = field.table[Table.Symbol.Name];
        if (field.columnType === "SQLiteNumericBigInt") {
          if (isSingleTable) {
            chunk.push(sql`cast(${sql.identifier(this.casing.getColumnCasing(field))} as text)`);
          } else {
            chunk.push(
              sql`cast(${sql.identifier(tableName)}.${sql.identifier(this.casing.getColumnCasing(field))} as text)`
            );
          }
        } else {
          if (isSingleTable) {
            chunk.push(sql.identifier(this.casing.getColumnCasing(field)));
          } else {
            chunk.push(sql`${sql.identifier(tableName)}.${sql.identifier(this.casing.getColumnCasing(field))}`);
          }
        }
      }
      if (i < columnsLen - 1) {
        chunk.push(sql`, `);
      }
      return chunk;
    });
    return sql.join(chunks);
  }
  buildJoins(joins) {
    if (!joins || joins.length === 0) {
      return void 0;
    }
    const joinsArray = [];
    if (joins) {
      for (const [index, joinMeta] of joins.entries()) {
        if (index === 0) {
          joinsArray.push(sql` `);
        }
        const table = joinMeta.table;
        const onSql = joinMeta.on ? sql` on ${joinMeta.on}` : void 0;
        if (is(table, SQLiteTable)) {
          const tableName = table[SQLiteTable.Symbol.Name];
          const tableSchema = table[SQLiteTable.Symbol.Schema];
          const origTableName = table[SQLiteTable.Symbol.OriginalName];
          const alias = tableName === origTableName ? void 0 : joinMeta.alias;
          joinsArray.push(
            sql`${sql.raw(joinMeta.joinType)} join ${tableSchema ? sql`${sql.identifier(tableSchema)}.` : void 0}${sql.identifier(origTableName)}${alias && sql` ${sql.identifier(alias)}`}${onSql}`
          );
        } else {
          joinsArray.push(
            sql`${sql.raw(joinMeta.joinType)} join ${table}${onSql}`
          );
        }
        if (index < joins.length - 1) {
          joinsArray.push(sql` `);
        }
      }
    }
    return sql.join(joinsArray);
  }
  buildLimit(limit) {
    return typeof limit === "object" || typeof limit === "number" && limit >= 0 ? sql` limit ${limit}` : void 0;
  }
  buildOrderBy(orderBy) {
    const orderByList = [];
    if (orderBy) {
      for (const [index, orderByValue] of orderBy.entries()) {
        orderByList.push(orderByValue);
        if (index < orderBy.length - 1) {
          orderByList.push(sql`, `);
        }
      }
    }
    return orderByList.length > 0 ? sql` order by ${sql.join(orderByList)}` : void 0;
  }
  buildFromTable(table) {
    if (is(table, Table) && table[Table.Symbol.IsAlias]) {
      return sql`${sql`${sql.identifier(table[Table.Symbol.Schema] ?? "")}.`.if(table[Table.Symbol.Schema])}${sql.identifier(table[Table.Symbol.OriginalName])} ${sql.identifier(table[Table.Symbol.Name])}`;
    }
    return table;
  }
  buildSelectQuery({
    withList,
    fields,
    fieldsFlat,
    where,
    having,
    table,
    joins,
    orderBy,
    groupBy,
    limit,
    offset,
    distinct,
    setOperators
  }) {
    const fieldsList = fieldsFlat ?? orderSelectedFields(fields);
    for (const f of fieldsList) {
      if (is(f.field, Column) && getTableName(f.field.table) !== (is(table, Subquery) ? table._.alias : is(table, SQLiteViewBase) ? table[ViewBaseConfig].name : is(table, SQL) ? void 0 : getTableName(table)) && !((table2) => joins?.some(
        ({ alias }) => alias === (table2[Table.Symbol.IsAlias] ? getTableName(table2) : table2[Table.Symbol.BaseName])
      ))(f.field.table)) {
        const tableName = getTableName(f.field.table);
        throw new Error(
          `Your "${f.path.join("->")}" field references a column "${tableName}"."${f.field.name}", but the table "${tableName}" is not part of the query! Did you forget to join it?`
        );
      }
    }
    const isSingleTable = !joins || joins.length === 0;
    const withSql = this.buildWithCTE(withList);
    const distinctSql = distinct ? sql` distinct` : void 0;
    const selection = this.buildSelection(fieldsList, { isSingleTable });
    const tableSql = this.buildFromTable(table);
    const joinsSql = this.buildJoins(joins);
    const whereSql = where ? sql` where ${where}` : void 0;
    const havingSql = having ? sql` having ${having}` : void 0;
    const groupByList = [];
    if (groupBy) {
      for (const [index, groupByValue] of groupBy.entries()) {
        groupByList.push(groupByValue);
        if (index < groupBy.length - 1) {
          groupByList.push(sql`, `);
        }
      }
    }
    const groupBySql = groupByList.length > 0 ? sql` group by ${sql.join(groupByList)}` : void 0;
    const orderBySql = this.buildOrderBy(orderBy);
    const limitSql = this.buildLimit(limit);
    const offsetSql = offset ? sql` offset ${offset}` : void 0;
    const finalQuery = sql`${withSql}select${distinctSql} ${selection} from ${tableSql}${joinsSql}${whereSql}${groupBySql}${havingSql}${orderBySql}${limitSql}${offsetSql}`;
    if (setOperators.length > 0) {
      return this.buildSetOperations(finalQuery, setOperators);
    }
    return finalQuery;
  }
  buildSetOperations(leftSelect, setOperators) {
    const [setOperator, ...rest] = setOperators;
    if (!setOperator) {
      throw new Error("Cannot pass undefined values to any set operator");
    }
    if (rest.length === 0) {
      return this.buildSetOperationQuery({ leftSelect, setOperator });
    }
    return this.buildSetOperations(
      this.buildSetOperationQuery({ leftSelect, setOperator }),
      rest
    );
  }
  buildSetOperationQuery({
    leftSelect,
    setOperator: { type, isAll, rightSelect, limit, orderBy, offset }
  }) {
    const leftChunk = sql`${leftSelect.getSQL()} `;
    const rightChunk = sql`${rightSelect.getSQL()}`;
    let orderBySql;
    if (orderBy && orderBy.length > 0) {
      const orderByValues = [];
      for (const singleOrderBy of orderBy) {
        if (is(singleOrderBy, SQLiteColumn)) {
          orderByValues.push(sql.identifier(singleOrderBy.name));
        } else if (is(singleOrderBy, SQL)) {
          for (let i = 0; i < singleOrderBy.queryChunks.length; i++) {
            const chunk = singleOrderBy.queryChunks[i];
            if (is(chunk, SQLiteColumn)) {
              singleOrderBy.queryChunks[i] = sql.identifier(this.casing.getColumnCasing(chunk));
            }
          }
          orderByValues.push(sql`${singleOrderBy}`);
        } else {
          orderByValues.push(sql`${singleOrderBy}`);
        }
      }
      orderBySql = sql` order by ${sql.join(orderByValues, sql`, `)}`;
    }
    const limitSql = typeof limit === "object" || typeof limit === "number" && limit >= 0 ? sql` limit ${limit}` : void 0;
    const operatorChunk = sql.raw(`${type} ${isAll ? "all " : ""}`);
    const offsetSql = offset ? sql` offset ${offset}` : void 0;
    return sql`${leftChunk}${operatorChunk}${rightChunk}${orderBySql}${limitSql}${offsetSql}`;
  }
  buildInsertQuery({ table, values: valuesOrSelect, onConflict, returning, withList, select }) {
    const valuesSqlList = [];
    const columns = table[Table.Symbol.Columns];
    const colEntries = Object.entries(columns).filter(
      ([_, col]) => !col.shouldDisableInsert()
    );
    const insertOrder = colEntries.map(([, column]) => sql.identifier(this.casing.getColumnCasing(column)));
    if (select) {
      const select2 = valuesOrSelect;
      if (is(select2, SQL)) {
        valuesSqlList.push(select2);
      } else {
        valuesSqlList.push(select2.getSQL());
      }
    } else {
      const values = valuesOrSelect;
      valuesSqlList.push(sql.raw("values "));
      for (const [valueIndex, value] of values.entries()) {
        const valueList = [];
        for (const [fieldName, col] of colEntries) {
          const colValue = value[fieldName];
          if (colValue === void 0 || is(colValue, Param) && colValue.value === void 0) {
            let defaultValue;
            if (col.default !== null && col.default !== void 0) {
              defaultValue = is(col.default, SQL) ? col.default : sql.param(col.default, col);
            } else if (col.defaultFn !== void 0) {
              const defaultFnResult = col.defaultFn();
              defaultValue = is(defaultFnResult, SQL) ? defaultFnResult : sql.param(defaultFnResult, col);
            } else if (!col.default && col.onUpdateFn !== void 0) {
              const onUpdateFnResult = col.onUpdateFn();
              defaultValue = is(onUpdateFnResult, SQL) ? onUpdateFnResult : sql.param(onUpdateFnResult, col);
            } else {
              defaultValue = sql`null`;
            }
            valueList.push(defaultValue);
          } else {
            valueList.push(colValue);
          }
        }
        valuesSqlList.push(valueList);
        if (valueIndex < values.length - 1) {
          valuesSqlList.push(sql`, `);
        }
      }
    }
    const withSql = this.buildWithCTE(withList);
    const valuesSql = sql.join(valuesSqlList);
    const returningSql = returning ? sql` returning ${this.buildSelection(returning, { isSingleTable: true })}` : void 0;
    const onConflictSql = onConflict?.length ? sql.join(onConflict) : void 0;
    return sql`${withSql}insert into ${table} ${insertOrder} ${valuesSql}${onConflictSql}${returningSql}`;
  }
  sqlToQuery(sql2, invokeSource) {
    return sql2.toQuery({
      casing: this.casing,
      escapeName: this.escapeName,
      escapeParam: this.escapeParam,
      escapeString: this.escapeString,
      invokeSource
    });
  }
  buildRelationalQuery({
    fullSchema,
    schema,
    tableNamesMap,
    table,
    tableConfig,
    queryConfig: config,
    tableAlias,
    nestedQueryRelation,
    joinOn
  }) {
    let selection = [];
    let limit, offset, orderBy = [], where;
    const joins = [];
    if (config === true) {
      const selectionEntries = Object.entries(tableConfig.columns);
      selection = selectionEntries.map(([key, value]) => ({
        dbKey: value.name,
        tsKey: key,
        field: aliasedTableColumn(value, tableAlias),
        relationTableTsKey: void 0,
        isJson: false,
        selection: []
      }));
    } else {
      const aliasedColumns = Object.fromEntries(
        Object.entries(tableConfig.columns).map(([key, value]) => [key, aliasedTableColumn(value, tableAlias)])
      );
      if (config.where) {
        const whereSql = typeof config.where === "function" ? config.where(aliasedColumns, getOperators()) : config.where;
        where = whereSql && mapColumnsInSQLToAlias(whereSql, tableAlias);
      }
      const fieldsSelection = [];
      let selectedColumns = [];
      if (config.columns) {
        let isIncludeMode = false;
        for (const [field, value] of Object.entries(config.columns)) {
          if (value === void 0) {
            continue;
          }
          if (field in tableConfig.columns) {
            if (!isIncludeMode && value === true) {
              isIncludeMode = true;
            }
            selectedColumns.push(field);
          }
        }
        if (selectedColumns.length > 0) {
          selectedColumns = isIncludeMode ? selectedColumns.filter((c) => config.columns?.[c] === true) : Object.keys(tableConfig.columns).filter((key) => !selectedColumns.includes(key));
        }
      } else {
        selectedColumns = Object.keys(tableConfig.columns);
      }
      for (const field of selectedColumns) {
        const column = tableConfig.columns[field];
        fieldsSelection.push({ tsKey: field, value: column });
      }
      let selectedRelations = [];
      if (config.with) {
        selectedRelations = Object.entries(config.with).filter((entry) => !!entry[1]).map(([tsKey, queryConfig]) => ({ tsKey, queryConfig, relation: tableConfig.relations[tsKey] }));
      }
      let extras;
      if (config.extras) {
        extras = typeof config.extras === "function" ? config.extras(aliasedColumns, { sql }) : config.extras;
        for (const [tsKey, value] of Object.entries(extras)) {
          fieldsSelection.push({
            tsKey,
            value: mapColumnsInAliasedSQLToAlias(value, tableAlias)
          });
        }
      }
      for (const { tsKey, value } of fieldsSelection) {
        selection.push({
          dbKey: is(value, SQL.Aliased) ? value.fieldAlias : tableConfig.columns[tsKey].name,
          tsKey,
          field: is(value, Column) ? aliasedTableColumn(value, tableAlias) : value,
          relationTableTsKey: void 0,
          isJson: false,
          selection: []
        });
      }
      let orderByOrig = typeof config.orderBy === "function" ? config.orderBy(aliasedColumns, getOrderByOperators()) : config.orderBy ?? [];
      if (!Array.isArray(orderByOrig)) {
        orderByOrig = [orderByOrig];
      }
      orderBy = orderByOrig.map((orderByValue) => {
        if (is(orderByValue, Column)) {
          return aliasedTableColumn(orderByValue, tableAlias);
        }
        return mapColumnsInSQLToAlias(orderByValue, tableAlias);
      });
      limit = config.limit;
      offset = config.offset;
      for (const {
        tsKey: selectedRelationTsKey,
        queryConfig: selectedRelationConfigValue,
        relation
      } of selectedRelations) {
        const normalizedRelation = normalizeRelation(schema, tableNamesMap, relation);
        const relationTableName = getTableUniqueName(relation.referencedTable);
        const relationTableTsName = tableNamesMap[relationTableName];
        const relationTableAlias = `${tableAlias}_${selectedRelationTsKey}`;
        const joinOn2 = and(
          ...normalizedRelation.fields.map(
            (field2, i) => eq(
              aliasedTableColumn(normalizedRelation.references[i], relationTableAlias),
              aliasedTableColumn(field2, tableAlias)
            )
          )
        );
        const builtRelation = this.buildRelationalQuery({
          fullSchema,
          schema,
          tableNamesMap,
          table: fullSchema[relationTableTsName],
          tableConfig: schema[relationTableTsName],
          queryConfig: is(relation, One) ? selectedRelationConfigValue === true ? { limit: 1 } : { ...selectedRelationConfigValue, limit: 1 } : selectedRelationConfigValue,
          tableAlias: relationTableAlias,
          joinOn: joinOn2,
          nestedQueryRelation: relation
        });
        const field = sql`(${builtRelation.sql})`.as(selectedRelationTsKey);
        selection.push({
          dbKey: selectedRelationTsKey,
          tsKey: selectedRelationTsKey,
          field,
          relationTableTsKey: relationTableTsName,
          isJson: true,
          selection: builtRelation.selection
        });
      }
    }
    if (selection.length === 0) {
      throw new DrizzleError({
        message: `No fields selected for table "${tableConfig.tsName}" ("${tableAlias}"). You need to have at least one item in "columns", "with" or "extras". If you need to select all columns, omit the "columns" key or set it to undefined.`
      });
    }
    let result;
    where = and(joinOn, where);
    if (nestedQueryRelation) {
      let field = sql`json_array(${sql.join(
        selection.map(
          ({ field: field2 }) => is(field2, SQLiteColumn) ? sql.identifier(this.casing.getColumnCasing(field2)) : is(field2, SQL.Aliased) ? field2.sql : field2
        ),
        sql`, `
      )})`;
      if (is(nestedQueryRelation, Many)) {
        field = sql`coalesce(json_group_array(${field}), json_array())`;
      }
      const nestedSelection = [{
        dbKey: "data",
        tsKey: "data",
        field: field.as("data"),
        isJson: true,
        relationTableTsKey: tableConfig.tsName,
        selection
      }];
      const needsSubquery = limit !== void 0 || offset !== void 0 || orderBy.length > 0;
      if (needsSubquery) {
        result = this.buildSelectQuery({
          table: aliasedTable(table, tableAlias),
          fields: {},
          fieldsFlat: [
            {
              path: [],
              field: sql.raw("*")
            }
          ],
          where,
          limit,
          offset,
          orderBy,
          setOperators: []
        });
        where = void 0;
        limit = void 0;
        offset = void 0;
        orderBy = void 0;
      } else {
        result = aliasedTable(table, tableAlias);
      }
      result = this.buildSelectQuery({
        table: is(result, SQLiteTable) ? result : new Subquery(result, {}, tableAlias),
        fields: {},
        fieldsFlat: nestedSelection.map(({ field: field2 }) => ({
          path: [],
          field: is(field2, Column) ? aliasedTableColumn(field2, tableAlias) : field2
        })),
        joins,
        where,
        limit,
        offset,
        orderBy,
        setOperators: []
      });
    } else {
      result = this.buildSelectQuery({
        table: aliasedTable(table, tableAlias),
        fields: {},
        fieldsFlat: selection.map(({ field }) => ({
          path: [],
          field: is(field, Column) ? aliasedTableColumn(field, tableAlias) : field
        })),
        joins,
        where,
        limit,
        offset,
        orderBy,
        setOperators: []
      });
    }
    return {
      tableTsKey: tableConfig.tsName,
      sql: result,
      selection
    };
  }
}
class SQLiteSyncDialect extends SQLiteDialect {
  static [entityKind] = "SQLiteSyncDialect";
  migrate(migrations, session, config) {
    const migrationsTable = config === void 0 ? "__drizzle_migrations" : typeof config === "string" ? "__drizzle_migrations" : config.migrationsTable ?? "__drizzle_migrations";
    const migrationTableCreate = sql`
			CREATE TABLE IF NOT EXISTS ${sql.identifier(migrationsTable)} (
				id SERIAL PRIMARY KEY,
				hash text NOT NULL,
				created_at numeric
			)
		`;
    session.run(migrationTableCreate);
    const dbMigrations = session.values(
      sql`SELECT id, hash, created_at FROM ${sql.identifier(migrationsTable)} ORDER BY created_at DESC LIMIT 1`
    );
    const lastDbMigration = dbMigrations[0] ?? void 0;
    session.run(sql`BEGIN`);
    try {
      for (const migration of migrations) {
        if (!lastDbMigration || Number(lastDbMigration[2]) < migration.folderMillis) {
          for (const stmt of migration.sql) {
            session.run(sql.raw(stmt));
          }
          session.run(
            sql`INSERT INTO ${sql.identifier(migrationsTable)} ("hash", "created_at") VALUES(${migration.hash}, ${migration.folderMillis})`
          );
        }
      }
      session.run(sql`COMMIT`);
    } catch (e) {
      session.run(sql`ROLLBACK`);
      throw e;
    }
  }
}
class SQLiteAsyncDialect extends SQLiteDialect {
  static [entityKind] = "SQLiteAsyncDialect";
  async migrate(migrations, session, config) {
    const migrationsTable = config === void 0 ? "__drizzle_migrations" : typeof config === "string" ? "__drizzle_migrations" : config.migrationsTable ?? "__drizzle_migrations";
    const migrationTableCreate = sql`
			CREATE TABLE IF NOT EXISTS ${sql.identifier(migrationsTable)} (
				id SERIAL PRIMARY KEY,
				hash text NOT NULL,
				created_at numeric
			)
		`;
    await session.run(migrationTableCreate);
    const dbMigrations = await session.values(
      sql`SELECT id, hash, created_at FROM ${sql.identifier(migrationsTable)} ORDER BY created_at DESC LIMIT 1`
    );
    const lastDbMigration = dbMigrations[0] ?? void 0;
    await session.transaction(async (tx) => {
      for (const migration of migrations) {
        if (!lastDbMigration || Number(lastDbMigration[2]) < migration.folderMillis) {
          for (const stmt of migration.sql) {
            await tx.run(sql.raw(stmt));
          }
          await tx.run(
            sql`INSERT INTO ${sql.identifier(migrationsTable)} ("hash", "created_at") VALUES(${migration.hash}, ${migration.folderMillis})`
          );
        }
      }
    });
  }
}

class TypedQueryBuilder {
  static [entityKind] = "TypedQueryBuilder";
  /** @internal */
  getSelectedFields() {
    return this._.selectedFields;
  }
}

class SQLiteSelectBuilder {
  static [entityKind] = "SQLiteSelectBuilder";
  fields;
  session;
  dialect;
  withList;
  distinct;
  constructor(config) {
    this.fields = config.fields;
    this.session = config.session;
    this.dialect = config.dialect;
    this.withList = config.withList;
    this.distinct = config.distinct;
  }
  from(source) {
    const isPartialSelect = !!this.fields;
    let fields;
    if (this.fields) {
      fields = this.fields;
    } else if (is(source, Subquery)) {
      fields = Object.fromEntries(
        Object.keys(source._.selectedFields).map((key) => [key, source[key]])
      );
    } else if (is(source, SQLiteViewBase)) {
      fields = source[ViewBaseConfig].selectedFields;
    } else if (is(source, SQL)) {
      fields = {};
    } else {
      fields = getTableColumns(source);
    }
    return new SQLiteSelectBase({
      table: source,
      fields,
      isPartialSelect,
      session: this.session,
      dialect: this.dialect,
      withList: this.withList,
      distinct: this.distinct
    });
  }
}
class SQLiteSelectQueryBuilderBase extends TypedQueryBuilder {
  static [entityKind] = "SQLiteSelectQueryBuilder";
  _;
  /** @internal */
  config;
  joinsNotNullableMap;
  tableName;
  isPartialSelect;
  session;
  dialect;
  cacheConfig = void 0;
  usedTables = /* @__PURE__ */ new Set();
  constructor({ table, fields, isPartialSelect, session, dialect, withList, distinct }) {
    super();
    this.config = {
      withList,
      table,
      fields: { ...fields },
      distinct,
      setOperators: []
    };
    this.isPartialSelect = isPartialSelect;
    this.session = session;
    this.dialect = dialect;
    this._ = {
      selectedFields: fields,
      config: this.config
    };
    this.tableName = getTableLikeName(table);
    this.joinsNotNullableMap = typeof this.tableName === "string" ? { [this.tableName]: true } : {};
    for (const item of extractUsedTable(table)) this.usedTables.add(item);
  }
  /** @internal */
  getUsedTables() {
    return [...this.usedTables];
  }
  createJoin(joinType) {
    return (table, on) => {
      const baseTableName = this.tableName;
      const tableName = getTableLikeName(table);
      for (const item of extractUsedTable(table)) this.usedTables.add(item);
      if (typeof tableName === "string" && this.config.joins?.some((join) => join.alias === tableName)) {
        throw new Error(`Alias "${tableName}" is already used in this query`);
      }
      if (!this.isPartialSelect) {
        if (Object.keys(this.joinsNotNullableMap).length === 1 && typeof baseTableName === "string") {
          this.config.fields = {
            [baseTableName]: this.config.fields
          };
        }
        if (typeof tableName === "string" && !is(table, SQL)) {
          const selection = is(table, Subquery) ? table._.selectedFields : is(table, View) ? table[ViewBaseConfig].selectedFields : table[Table.Symbol.Columns];
          this.config.fields[tableName] = selection;
        }
      }
      if (typeof on === "function") {
        on = on(
          new Proxy(
            this.config.fields,
            new SelectionProxyHandler({ sqlAliasedBehavior: "sql", sqlBehavior: "sql" })
          )
        );
      }
      if (!this.config.joins) {
        this.config.joins = [];
      }
      this.config.joins.push({ on, table, joinType, alias: tableName });
      if (typeof tableName === "string") {
        switch (joinType) {
          case "left": {
            this.joinsNotNullableMap[tableName] = false;
            break;
          }
          case "right": {
            this.joinsNotNullableMap = Object.fromEntries(
              Object.entries(this.joinsNotNullableMap).map(([key]) => [key, false])
            );
            this.joinsNotNullableMap[tableName] = true;
            break;
          }
          case "cross":
          case "inner": {
            this.joinsNotNullableMap[tableName] = true;
            break;
          }
          case "full": {
            this.joinsNotNullableMap = Object.fromEntries(
              Object.entries(this.joinsNotNullableMap).map(([key]) => [key, false])
            );
            this.joinsNotNullableMap[tableName] = false;
            break;
          }
        }
      }
      return this;
    };
  }
  /**
   * Executes a `left join` operation by adding another table to the current query.
   *
   * Calling this method associates each row of the table with the corresponding row from the joined table, if a match is found. If no matching row exists, it sets all columns of the joined table to null.
   *
   * See docs: {@link https://orm.drizzle.team/docs/joins#left-join}
   *
   * @param table the table to join.
   * @param on the `on` clause.
   *
   * @example
   *
   * ```ts
   * // Select all users and their pets
   * const usersWithPets: { user: User; pets: Pet | null; }[] = await db.select()
   *   .from(users)
   *   .leftJoin(pets, eq(users.id, pets.ownerId))
   *
   * // Select userId and petId
   * const usersIdsAndPetIds: { userId: number; petId: number | null; }[] = await db.select({
   *   userId: users.id,
   *   petId: pets.id,
   * })
   *   .from(users)
   *   .leftJoin(pets, eq(users.id, pets.ownerId))
   * ```
   */
  leftJoin = this.createJoin("left");
  /**
   * Executes a `right join` operation by adding another table to the current query.
   *
   * Calling this method associates each row of the joined table with the corresponding row from the main table, if a match is found. If no matching row exists, it sets all columns of the main table to null.
   *
   * See docs: {@link https://orm.drizzle.team/docs/joins#right-join}
   *
   * @param table the table to join.
   * @param on the `on` clause.
   *
   * @example
   *
   * ```ts
   * // Select all users and their pets
   * const usersWithPets: { user: User | null; pets: Pet; }[] = await db.select()
   *   .from(users)
   *   .rightJoin(pets, eq(users.id, pets.ownerId))
   *
   * // Select userId and petId
   * const usersIdsAndPetIds: { userId: number | null; petId: number; }[] = await db.select({
   *   userId: users.id,
   *   petId: pets.id,
   * })
   *   .from(users)
   *   .rightJoin(pets, eq(users.id, pets.ownerId))
   * ```
   */
  rightJoin = this.createJoin("right");
  /**
   * Executes an `inner join` operation, creating a new table by combining rows from two tables that have matching values.
   *
   * Calling this method retrieves rows that have corresponding entries in both joined tables. Rows without matching entries in either table are excluded, resulting in a table that includes only matching pairs.
   *
   * See docs: {@link https://orm.drizzle.team/docs/joins#inner-join}
   *
   * @param table the table to join.
   * @param on the `on` clause.
   *
   * @example
   *
   * ```ts
   * // Select all users and their pets
   * const usersWithPets: { user: User; pets: Pet; }[] = await db.select()
   *   .from(users)
   *   .innerJoin(pets, eq(users.id, pets.ownerId))
   *
   * // Select userId and petId
   * const usersIdsAndPetIds: { userId: number; petId: number; }[] = await db.select({
   *   userId: users.id,
   *   petId: pets.id,
   * })
   *   .from(users)
   *   .innerJoin(pets, eq(users.id, pets.ownerId))
   * ```
   */
  innerJoin = this.createJoin("inner");
  /**
   * Executes a `full join` operation by combining rows from two tables into a new table.
   *
   * Calling this method retrieves all rows from both main and joined tables, merging rows with matching values and filling in `null` for non-matching columns.
   *
   * See docs: {@link https://orm.drizzle.team/docs/joins#full-join}
   *
   * @param table the table to join.
   * @param on the `on` clause.
   *
   * @example
   *
   * ```ts
   * // Select all users and their pets
   * const usersWithPets: { user: User | null; pets: Pet | null; }[] = await db.select()
   *   .from(users)
   *   .fullJoin(pets, eq(users.id, pets.ownerId))
   *
   * // Select userId and petId
   * const usersIdsAndPetIds: { userId: number | null; petId: number | null; }[] = await db.select({
   *   userId: users.id,
   *   petId: pets.id,
   * })
   *   .from(users)
   *   .fullJoin(pets, eq(users.id, pets.ownerId))
   * ```
   */
  fullJoin = this.createJoin("full");
  /**
   * Executes a `cross join` operation by combining rows from two tables into a new table.
   *
   * Calling this method retrieves all rows from both main and joined tables, merging all rows from each table.
   *
   * See docs: {@link https://orm.drizzle.team/docs/joins#cross-join}
   *
   * @param table the table to join.
   *
   * @example
   *
   * ```ts
   * // Select all users, each user with every pet
   * const usersWithPets: { user: User; pets: Pet; }[] = await db.select()
   *   .from(users)
   *   .crossJoin(pets)
   *
   * // Select userId and petId
   * const usersIdsAndPetIds: { userId: number; petId: number; }[] = await db.select({
   *   userId: users.id,
   *   petId: pets.id,
   * })
   *   .from(users)
   *   .crossJoin(pets)
   * ```
   */
  crossJoin = this.createJoin("cross");
  createSetOperator(type, isAll) {
    return (rightSelection) => {
      const rightSelect = typeof rightSelection === "function" ? rightSelection(getSQLiteSetOperators()) : rightSelection;
      if (!haveSameKeys(this.getSelectedFields(), rightSelect.getSelectedFields())) {
        throw new Error(
          "Set operator error (union / intersect / except): selected fields are not the same or are in a different order"
        );
      }
      this.config.setOperators.push({ type, isAll, rightSelect });
      return this;
    };
  }
  /**
   * Adds `union` set operator to the query.
   *
   * Calling this method will combine the result sets of the `select` statements and remove any duplicate rows that appear across them.
   *
   * See docs: {@link https://orm.drizzle.team/docs/set-operations#union}
   *
   * @example
   *
   * ```ts
   * // Select all unique names from customers and users tables
   * await db.select({ name: users.name })
   *   .from(users)
   *   .union(
   *     db.select({ name: customers.name }).from(customers)
   *   );
   * // or
   * import { union } from 'drizzle-orm/sqlite-core'
   *
   * await union(
   *   db.select({ name: users.name }).from(users),
   *   db.select({ name: customers.name }).from(customers)
   * );
   * ```
   */
  union = this.createSetOperator("union", false);
  /**
   * Adds `union all` set operator to the query.
   *
   * Calling this method will combine the result-set of the `select` statements and keep all duplicate rows that appear across them.
   *
   * See docs: {@link https://orm.drizzle.team/docs/set-operations#union-all}
   *
   * @example
   *
   * ```ts
   * // Select all transaction ids from both online and in-store sales
   * await db.select({ transaction: onlineSales.transactionId })
   *   .from(onlineSales)
   *   .unionAll(
   *     db.select({ transaction: inStoreSales.transactionId }).from(inStoreSales)
   *   );
   * // or
   * import { unionAll } from 'drizzle-orm/sqlite-core'
   *
   * await unionAll(
   *   db.select({ transaction: onlineSales.transactionId }).from(onlineSales),
   *   db.select({ transaction: inStoreSales.transactionId }).from(inStoreSales)
   * );
   * ```
   */
  unionAll = this.createSetOperator("union", true);
  /**
   * Adds `intersect` set operator to the query.
   *
   * Calling this method will retain only the rows that are present in both result sets and eliminate duplicates.
   *
   * See docs: {@link https://orm.drizzle.team/docs/set-operations#intersect}
   *
   * @example
   *
   * ```ts
   * // Select course names that are offered in both departments A and B
   * await db.select({ courseName: depA.courseName })
   *   .from(depA)
   *   .intersect(
   *     db.select({ courseName: depB.courseName }).from(depB)
   *   );
   * // or
   * import { intersect } from 'drizzle-orm/sqlite-core'
   *
   * await intersect(
   *   db.select({ courseName: depA.courseName }).from(depA),
   *   db.select({ courseName: depB.courseName }).from(depB)
   * );
   * ```
   */
  intersect = this.createSetOperator("intersect", false);
  /**
   * Adds `except` set operator to the query.
   *
   * Calling this method will retrieve all unique rows from the left query, except for the rows that are present in the result set of the right query.
   *
   * See docs: {@link https://orm.drizzle.team/docs/set-operations#except}
   *
   * @example
   *
   * ```ts
   * // Select all courses offered in department A but not in department B
   * await db.select({ courseName: depA.courseName })
   *   .from(depA)
   *   .except(
   *     db.select({ courseName: depB.courseName }).from(depB)
   *   );
   * // or
   * import { except } from 'drizzle-orm/sqlite-core'
   *
   * await except(
   *   db.select({ courseName: depA.courseName }).from(depA),
   *   db.select({ courseName: depB.courseName }).from(depB)
   * );
   * ```
   */
  except = this.createSetOperator("except", false);
  /** @internal */
  addSetOperators(setOperators) {
    this.config.setOperators.push(...setOperators);
    return this;
  }
  /**
   * Adds a `where` clause to the query.
   *
   * Calling this method will select only those rows that fulfill a specified condition.
   *
   * See docs: {@link https://orm.drizzle.team/docs/select#filtering}
   *
   * @param where the `where` clause.
   *
   * @example
   * You can use conditional operators and `sql function` to filter the rows to be selected.
   *
   * ```ts
   * // Select all cars with green color
   * await db.select().from(cars).where(eq(cars.color, 'green'));
   * // or
   * await db.select().from(cars).where(sql`${cars.color} = 'green'`)
   * ```
   *
   * You can logically combine conditional operators with `and()` and `or()` operators:
   *
   * ```ts
   * // Select all BMW cars with a green color
   * await db.select().from(cars).where(and(eq(cars.color, 'green'), eq(cars.brand, 'BMW')));
   *
   * // Select all cars with the green or blue color
   * await db.select().from(cars).where(or(eq(cars.color, 'green'), eq(cars.color, 'blue')));
   * ```
   */
  where(where) {
    if (typeof where === "function") {
      where = where(
        new Proxy(
          this.config.fields,
          new SelectionProxyHandler({ sqlAliasedBehavior: "sql", sqlBehavior: "sql" })
        )
      );
    }
    this.config.where = where;
    return this;
  }
  /**
   * Adds a `having` clause to the query.
   *
   * Calling this method will select only those rows that fulfill a specified condition. It is typically used with aggregate functions to filter the aggregated data based on a specified condition.
   *
   * See docs: {@link https://orm.drizzle.team/docs/select#aggregations}
   *
   * @param having the `having` clause.
   *
   * @example
   *
   * ```ts
   * // Select all brands with more than one car
   * await db.select({
   * 	brand: cars.brand,
   * 	count: sql<number>`cast(count(${cars.id}) as int)`,
   * })
   *   .from(cars)
   *   .groupBy(cars.brand)
   *   .having(({ count }) => gt(count, 1));
   * ```
   */
  having(having) {
    if (typeof having === "function") {
      having = having(
        new Proxy(
          this.config.fields,
          new SelectionProxyHandler({ sqlAliasedBehavior: "sql", sqlBehavior: "sql" })
        )
      );
    }
    this.config.having = having;
    return this;
  }
  groupBy(...columns) {
    if (typeof columns[0] === "function") {
      const groupBy = columns[0](
        new Proxy(
          this.config.fields,
          new SelectionProxyHandler({ sqlAliasedBehavior: "alias", sqlBehavior: "sql" })
        )
      );
      this.config.groupBy = Array.isArray(groupBy) ? groupBy : [groupBy];
    } else {
      this.config.groupBy = columns;
    }
    return this;
  }
  orderBy(...columns) {
    if (typeof columns[0] === "function") {
      const orderBy = columns[0](
        new Proxy(
          this.config.fields,
          new SelectionProxyHandler({ sqlAliasedBehavior: "alias", sqlBehavior: "sql" })
        )
      );
      const orderByArray = Array.isArray(orderBy) ? orderBy : [orderBy];
      if (this.config.setOperators.length > 0) {
        this.config.setOperators.at(-1).orderBy = orderByArray;
      } else {
        this.config.orderBy = orderByArray;
      }
    } else {
      const orderByArray = columns;
      if (this.config.setOperators.length > 0) {
        this.config.setOperators.at(-1).orderBy = orderByArray;
      } else {
        this.config.orderBy = orderByArray;
      }
    }
    return this;
  }
  /**
   * Adds a `limit` clause to the query.
   *
   * Calling this method will set the maximum number of rows that will be returned by this query.
   *
   * See docs: {@link https://orm.drizzle.team/docs/select#limit--offset}
   *
   * @param limit the `limit` clause.
   *
   * @example
   *
   * ```ts
   * // Get the first 10 people from this query.
   * await db.select().from(people).limit(10);
   * ```
   */
  limit(limit) {
    if (this.config.setOperators.length > 0) {
      this.config.setOperators.at(-1).limit = limit;
    } else {
      this.config.limit = limit;
    }
    return this;
  }
  /**
   * Adds an `offset` clause to the query.
   *
   * Calling this method will skip a number of rows when returning results from this query.
   *
   * See docs: {@link https://orm.drizzle.team/docs/select#limit--offset}
   *
   * @param offset the `offset` clause.
   *
   * @example
   *
   * ```ts
   * // Get the 10th-20th people from this query.
   * await db.select().from(people).offset(10).limit(10);
   * ```
   */
  offset(offset) {
    if (this.config.setOperators.length > 0) {
      this.config.setOperators.at(-1).offset = offset;
    } else {
      this.config.offset = offset;
    }
    return this;
  }
  /** @internal */
  getSQL() {
    return this.dialect.buildSelectQuery(this.config);
  }
  toSQL() {
    const { typings: _typings, ...rest } = this.dialect.sqlToQuery(this.getSQL());
    return rest;
  }
  as(alias) {
    const usedTables = [];
    usedTables.push(...extractUsedTable(this.config.table));
    if (this.config.joins) {
      for (const it of this.config.joins) usedTables.push(...extractUsedTable(it.table));
    }
    return new Proxy(
      new Subquery(this.getSQL(), this.config.fields, alias, false, [...new Set(usedTables)]),
      new SelectionProxyHandler({ alias, sqlAliasedBehavior: "alias", sqlBehavior: "error" })
    );
  }
  /** @internal */
  getSelectedFields() {
    return new Proxy(
      this.config.fields,
      new SelectionProxyHandler({ alias: this.tableName, sqlAliasedBehavior: "alias", sqlBehavior: "error" })
    );
  }
  $dynamic() {
    return this;
  }
}
class SQLiteSelectBase extends SQLiteSelectQueryBuilderBase {
  static [entityKind] = "SQLiteSelect";
  /** @internal */
  _prepare(isOneTimeQuery = true) {
    if (!this.session) {
      throw new Error("Cannot execute a query on a query builder. Please use a database instance instead.");
    }
    const fieldsList = orderSelectedFields(this.config.fields);
    const query = this.session[isOneTimeQuery ? "prepareOneTimeQuery" : "prepareQuery"](
      this.dialect.sqlToQuery(this.getSQL()),
      fieldsList,
      "all",
      true,
      void 0,
      {
        type: "select",
        tables: [...this.usedTables]
      },
      this.cacheConfig
    );
    query.joinsNotNullableMap = this.joinsNotNullableMap;
    return query;
  }
  $withCache(config) {
    this.cacheConfig = config === void 0 ? { config: {}, enable: true, autoInvalidate: true } : config === false ? { enable: false } : { enable: true, autoInvalidate: true, ...config };
    return this;
  }
  prepare() {
    return this._prepare(false);
  }
  run = (placeholderValues) => {
    return this._prepare().run(placeholderValues);
  };
  all = (placeholderValues) => {
    return this._prepare().all(placeholderValues);
  };
  get = (placeholderValues) => {
    return this._prepare().get(placeholderValues);
  };
  values = (placeholderValues) => {
    return this._prepare().values(placeholderValues);
  };
  async execute() {
    return this.all();
  }
}
applyMixins(SQLiteSelectBase, [QueryPromise]);
function createSetOperator(type, isAll) {
  return (leftSelect, rightSelect, ...restSelects) => {
    const setOperators = [rightSelect, ...restSelects].map((select) => ({
      type,
      isAll,
      rightSelect: select
    }));
    for (const setOperator of setOperators) {
      if (!haveSameKeys(leftSelect.getSelectedFields(), setOperator.rightSelect.getSelectedFields())) {
        throw new Error(
          "Set operator error (union / intersect / except): selected fields are not the same or are in a different order"
        );
      }
    }
    return leftSelect.addSetOperators(setOperators);
  };
}
const getSQLiteSetOperators = () => ({
  union,
  unionAll,
  intersect,
  except
});
const union = createSetOperator("union", false);
const unionAll = createSetOperator("union", true);
const intersect = createSetOperator("intersect", false);
const except = createSetOperator("except", false);

class QueryBuilder {
  static [entityKind] = "SQLiteQueryBuilder";
  dialect;
  dialectConfig;
  constructor(dialect) {
    this.dialect = is(dialect, SQLiteDialect) ? dialect : void 0;
    this.dialectConfig = is(dialect, SQLiteDialect) ? void 0 : dialect;
  }
  $with = (alias, selection) => {
    const queryBuilder = this;
    const as = (qb) => {
      if (typeof qb === "function") {
        qb = qb(queryBuilder);
      }
      return new Proxy(
        new WithSubquery(
          qb.getSQL(),
          selection ?? ("getSelectedFields" in qb ? qb.getSelectedFields() ?? {} : {}),
          alias,
          true
        ),
        new SelectionProxyHandler({ alias, sqlAliasedBehavior: "alias", sqlBehavior: "error" })
      );
    };
    return { as };
  };
  with(...queries) {
    const self = this;
    function select(fields) {
      return new SQLiteSelectBuilder({
        fields: fields ?? void 0,
        session: void 0,
        dialect: self.getDialect(),
        withList: queries
      });
    }
    function selectDistinct(fields) {
      return new SQLiteSelectBuilder({
        fields: fields ?? void 0,
        session: void 0,
        dialect: self.getDialect(),
        withList: queries,
        distinct: true
      });
    }
    return { select, selectDistinct };
  }
  select(fields) {
    return new SQLiteSelectBuilder({ fields: fields ?? void 0, session: void 0, dialect: this.getDialect() });
  }
  selectDistinct(fields) {
    return new SQLiteSelectBuilder({
      fields: fields ?? void 0,
      session: void 0,
      dialect: this.getDialect(),
      distinct: true
    });
  }
  // Lazy load dialect to avoid circular dependency
  getDialect() {
    if (!this.dialect) {
      this.dialect = new SQLiteSyncDialect(this.dialectConfig);
    }
    return this.dialect;
  }
}

class SQLiteInsertBuilder {
  constructor(table, session, dialect, withList) {
    this.table = table;
    this.session = session;
    this.dialect = dialect;
    this.withList = withList;
  }
  static [entityKind] = "SQLiteInsertBuilder";
  values(values) {
    values = Array.isArray(values) ? values : [values];
    if (values.length === 0) {
      throw new Error("values() must be called with at least one value");
    }
    const mappedValues = values.map((entry) => {
      const result = {};
      const cols = this.table[Table.Symbol.Columns];
      for (const colKey of Object.keys(entry)) {
        const colValue = entry[colKey];
        result[colKey] = is(colValue, SQL) ? colValue : new Param(colValue, cols[colKey]);
      }
      return result;
    });
    return new SQLiteInsertBase(this.table, mappedValues, this.session, this.dialect, this.withList);
  }
  select(selectQuery) {
    const select = typeof selectQuery === "function" ? selectQuery(new QueryBuilder()) : selectQuery;
    if (!is(select, SQL) && !haveSameKeys(this.table[Columns], select._.selectedFields)) {
      throw new Error(
        "Insert select error: selected fields are not the same or are in a different order compared to the table definition"
      );
    }
    return new SQLiteInsertBase(this.table, select, this.session, this.dialect, this.withList, true);
  }
}
class SQLiteInsertBase extends QueryPromise {
  constructor(table, values, session, dialect, withList, select) {
    super();
    this.session = session;
    this.dialect = dialect;
    this.config = { table, values, withList, select };
  }
  static [entityKind] = "SQLiteInsert";
  /** @internal */
  config;
  returning(fields = this.config.table[SQLiteTable.Symbol.Columns]) {
    this.config.returning = orderSelectedFields(fields);
    return this;
  }
  /**
   * Adds an `on conflict do nothing` clause to the query.
   *
   * Calling this method simply avoids inserting a row as its alternative action.
   *
   * See docs: {@link https://orm.drizzle.team/docs/insert#on-conflict-do-nothing}
   *
   * @param config The `target` and `where` clauses.
   *
   * @example
   * ```ts
   * // Insert one row and cancel the insert if there's a conflict
   * await db.insert(cars)
   *   .values({ id: 1, brand: 'BMW' })
   *   .onConflictDoNothing();
   *
   * // Explicitly specify conflict target
   * await db.insert(cars)
   *   .values({ id: 1, brand: 'BMW' })
   *   .onConflictDoNothing({ target: cars.id });
   * ```
   */
  onConflictDoNothing(config = {}) {
    if (!this.config.onConflict) this.config.onConflict = [];
    if (config.target === void 0) {
      this.config.onConflict.push(sql` on conflict do nothing`);
    } else {
      const targetSql = Array.isArray(config.target) ? sql`${config.target}` : sql`${[config.target]}`;
      const whereSql = config.where ? sql` where ${config.where}` : sql``;
      this.config.onConflict.push(sql` on conflict ${targetSql} do nothing${whereSql}`);
    }
    return this;
  }
  /**
   * Adds an `on conflict do update` clause to the query.
   *
   * Calling this method will update the existing row that conflicts with the row proposed for insertion as its alternative action.
   *
   * See docs: {@link https://orm.drizzle.team/docs/insert#upserts-and-conflicts}
   *
   * @param config The `target`, `set` and `where` clauses.
   *
   * @example
   * ```ts
   * // Update the row if there's a conflict
   * await db.insert(cars)
   *   .values({ id: 1, brand: 'BMW' })
   *   .onConflictDoUpdate({
   *     target: cars.id,
   *     set: { brand: 'Porsche' }
   *   });
   *
   * // Upsert with 'where' clause
   * await db.insert(cars)
   *   .values({ id: 1, brand: 'BMW' })
   *   .onConflictDoUpdate({
   *     target: cars.id,
   *     set: { brand: 'newBMW' },
   *     where: sql`${cars.createdAt} > '2023-01-01'::date`,
   *   });
   * ```
   */
  onConflictDoUpdate(config) {
    if (config.where && (config.targetWhere || config.setWhere)) {
      throw new Error(
        'You cannot use both "where" and "targetWhere"/"setWhere" at the same time - "where" is deprecated, use "targetWhere" or "setWhere" instead.'
      );
    }
    if (!this.config.onConflict) this.config.onConflict = [];
    const whereSql = config.where ? sql` where ${config.where}` : void 0;
    const targetWhereSql = config.targetWhere ? sql` where ${config.targetWhere}` : void 0;
    const setWhereSql = config.setWhere ? sql` where ${config.setWhere}` : void 0;
    const targetSql = Array.isArray(config.target) ? sql`${config.target}` : sql`${[config.target]}`;
    const setSql = this.dialect.buildUpdateSet(this.config.table, mapUpdateSet(this.config.table, config.set));
    this.config.onConflict.push(
      sql` on conflict ${targetSql}${targetWhereSql} do update set ${setSql}${whereSql}${setWhereSql}`
    );
    return this;
  }
  /** @internal */
  getSQL() {
    return this.dialect.buildInsertQuery(this.config);
  }
  toSQL() {
    const { typings: _typings, ...rest } = this.dialect.sqlToQuery(this.getSQL());
    return rest;
  }
  /** @internal */
  _prepare(isOneTimeQuery = true) {
    return this.session[isOneTimeQuery ? "prepareOneTimeQuery" : "prepareQuery"](
      this.dialect.sqlToQuery(this.getSQL()),
      this.config.returning,
      this.config.returning ? "all" : "run",
      true,
      void 0,
      {
        type: "insert",
        tables: extractUsedTable(this.config.table)
      }
    );
  }
  prepare() {
    return this._prepare(false);
  }
  run = (placeholderValues) => {
    return this._prepare().run(placeholderValues);
  };
  all = (placeholderValues) => {
    return this._prepare().all(placeholderValues);
  };
  get = (placeholderValues) => {
    return this._prepare().get(placeholderValues);
  };
  values = (placeholderValues) => {
    return this._prepare().values(placeholderValues);
  };
  async execute() {
    return this.config.returning ? this.all() : this.run();
  }
  $dynamic() {
    return this;
  }
}

class SQLiteUpdateBuilder {
  constructor(table, session, dialect, withList) {
    this.table = table;
    this.session = session;
    this.dialect = dialect;
    this.withList = withList;
  }
  static [entityKind] = "SQLiteUpdateBuilder";
  set(values) {
    return new SQLiteUpdateBase(
      this.table,
      mapUpdateSet(this.table, values),
      this.session,
      this.dialect,
      this.withList
    );
  }
}
class SQLiteUpdateBase extends QueryPromise {
  constructor(table, set, session, dialect, withList) {
    super();
    this.session = session;
    this.dialect = dialect;
    this.config = { set, table, withList, joins: [] };
  }
  static [entityKind] = "SQLiteUpdate";
  /** @internal */
  config;
  from(source) {
    this.config.from = source;
    return this;
  }
  createJoin(joinType) {
    return (table, on) => {
      const tableName = getTableLikeName(table);
      if (typeof tableName === "string" && this.config.joins.some((join) => join.alias === tableName)) {
        throw new Error(`Alias "${tableName}" is already used in this query`);
      }
      if (typeof on === "function") {
        const from = this.config.from ? is(table, SQLiteTable) ? table[Table.Symbol.Columns] : is(table, Subquery) ? table._.selectedFields : is(table, SQLiteViewBase) ? table[ViewBaseConfig].selectedFields : void 0 : void 0;
        on = on(
          new Proxy(
            this.config.table[Table.Symbol.Columns],
            new SelectionProxyHandler({ sqlAliasedBehavior: "sql", sqlBehavior: "sql" })
          ),
          from && new Proxy(
            from,
            new SelectionProxyHandler({ sqlAliasedBehavior: "sql", sqlBehavior: "sql" })
          )
        );
      }
      this.config.joins.push({ on, table, joinType, alias: tableName });
      return this;
    };
  }
  leftJoin = this.createJoin("left");
  rightJoin = this.createJoin("right");
  innerJoin = this.createJoin("inner");
  fullJoin = this.createJoin("full");
  /**
   * Adds a 'where' clause to the query.
   *
   * Calling this method will update only those rows that fulfill a specified condition.
   *
   * See docs: {@link https://orm.drizzle.team/docs/update}
   *
   * @param where the 'where' clause.
   *
   * @example
   * You can use conditional operators and `sql function` to filter the rows to be updated.
   *
   * ```ts
   * // Update all cars with green color
   * db.update(cars).set({ color: 'red' })
   *   .where(eq(cars.color, 'green'));
   * // or
   * db.update(cars).set({ color: 'red' })
   *   .where(sql`${cars.color} = 'green'`)
   * ```
   *
   * You can logically combine conditional operators with `and()` and `or()` operators:
   *
   * ```ts
   * // Update all BMW cars with a green color
   * db.update(cars).set({ color: 'red' })
   *   .where(and(eq(cars.color, 'green'), eq(cars.brand, 'BMW')));
   *
   * // Update all cars with the green or blue color
   * db.update(cars).set({ color: 'red' })
   *   .where(or(eq(cars.color, 'green'), eq(cars.color, 'blue')));
   * ```
   */
  where(where) {
    this.config.where = where;
    return this;
  }
  orderBy(...columns) {
    if (typeof columns[0] === "function") {
      const orderBy = columns[0](
        new Proxy(
          this.config.table[Table.Symbol.Columns],
          new SelectionProxyHandler({ sqlAliasedBehavior: "alias", sqlBehavior: "sql" })
        )
      );
      const orderByArray = Array.isArray(orderBy) ? orderBy : [orderBy];
      this.config.orderBy = orderByArray;
    } else {
      const orderByArray = columns;
      this.config.orderBy = orderByArray;
    }
    return this;
  }
  limit(limit) {
    this.config.limit = limit;
    return this;
  }
  returning(fields = this.config.table[SQLiteTable.Symbol.Columns]) {
    this.config.returning = orderSelectedFields(fields);
    return this;
  }
  /** @internal */
  getSQL() {
    return this.dialect.buildUpdateQuery(this.config);
  }
  toSQL() {
    const { typings: _typings, ...rest } = this.dialect.sqlToQuery(this.getSQL());
    return rest;
  }
  /** @internal */
  _prepare(isOneTimeQuery = true) {
    return this.session[isOneTimeQuery ? "prepareOneTimeQuery" : "prepareQuery"](
      this.dialect.sqlToQuery(this.getSQL()),
      this.config.returning,
      this.config.returning ? "all" : "run",
      true,
      void 0,
      {
        type: "insert",
        tables: extractUsedTable(this.config.table)
      }
    );
  }
  prepare() {
    return this._prepare(false);
  }
  run = (placeholderValues) => {
    return this._prepare().run(placeholderValues);
  };
  all = (placeholderValues) => {
    return this._prepare().all(placeholderValues);
  };
  get = (placeholderValues) => {
    return this._prepare().get(placeholderValues);
  };
  values = (placeholderValues) => {
    return this._prepare().values(placeholderValues);
  };
  async execute() {
    return this.config.returning ? this.all() : this.run();
  }
  $dynamic() {
    return this;
  }
}

class SQLiteCountBuilder extends SQL {
  constructor(params) {
    super(SQLiteCountBuilder.buildEmbeddedCount(params.source, params.filters).queryChunks);
    this.params = params;
    this.session = params.session;
    this.sql = SQLiteCountBuilder.buildCount(
      params.source,
      params.filters
    );
  }
  sql;
  static [entityKind] = "SQLiteCountBuilderAsync";
  [Symbol.toStringTag] = "SQLiteCountBuilderAsync";
  session;
  static buildEmbeddedCount(source, filters) {
    return sql`(select count(*) from ${source}${sql.raw(" where ").if(filters)}${filters})`;
  }
  static buildCount(source, filters) {
    return sql`select count(*) from ${source}${sql.raw(" where ").if(filters)}${filters}`;
  }
  then(onfulfilled, onrejected) {
    return Promise.resolve(this.session.count(this.sql)).then(
      onfulfilled,
      onrejected
    );
  }
  catch(onRejected) {
    return this.then(void 0, onRejected);
  }
  finally(onFinally) {
    return this.then(
      (value) => {
        onFinally?.();
        return value;
      },
      (reason) => {
        onFinally?.();
        throw reason;
      }
    );
  }
}

class RelationalQueryBuilder {
  constructor(mode, fullSchema, schema, tableNamesMap, table, tableConfig, dialect, session) {
    this.mode = mode;
    this.fullSchema = fullSchema;
    this.schema = schema;
    this.tableNamesMap = tableNamesMap;
    this.table = table;
    this.tableConfig = tableConfig;
    this.dialect = dialect;
    this.session = session;
  }
  static [entityKind] = "SQLiteAsyncRelationalQueryBuilder";
  findMany(config) {
    return this.mode === "sync" ? new SQLiteSyncRelationalQuery(
      this.fullSchema,
      this.schema,
      this.tableNamesMap,
      this.table,
      this.tableConfig,
      this.dialect,
      this.session,
      config ? config : {},
      "many"
    ) : new SQLiteRelationalQuery(
      this.fullSchema,
      this.schema,
      this.tableNamesMap,
      this.table,
      this.tableConfig,
      this.dialect,
      this.session,
      config ? config : {},
      "many"
    );
  }
  findFirst(config) {
    return this.mode === "sync" ? new SQLiteSyncRelationalQuery(
      this.fullSchema,
      this.schema,
      this.tableNamesMap,
      this.table,
      this.tableConfig,
      this.dialect,
      this.session,
      config ? { ...config, limit: 1 } : { limit: 1 },
      "first"
    ) : new SQLiteRelationalQuery(
      this.fullSchema,
      this.schema,
      this.tableNamesMap,
      this.table,
      this.tableConfig,
      this.dialect,
      this.session,
      config ? { ...config, limit: 1 } : { limit: 1 },
      "first"
    );
  }
}
class SQLiteRelationalQuery extends QueryPromise {
  constructor(fullSchema, schema, tableNamesMap, table, tableConfig, dialect, session, config, mode) {
    super();
    this.fullSchema = fullSchema;
    this.schema = schema;
    this.tableNamesMap = tableNamesMap;
    this.table = table;
    this.tableConfig = tableConfig;
    this.dialect = dialect;
    this.session = session;
    this.config = config;
    this.mode = mode;
  }
  static [entityKind] = "SQLiteAsyncRelationalQuery";
  /** @internal */
  mode;
  /** @internal */
  getSQL() {
    return this.dialect.buildRelationalQuery({
      fullSchema: this.fullSchema,
      schema: this.schema,
      tableNamesMap: this.tableNamesMap,
      table: this.table,
      tableConfig: this.tableConfig,
      queryConfig: this.config,
      tableAlias: this.tableConfig.tsName
    }).sql;
  }
  /** @internal */
  _prepare(isOneTimeQuery = false) {
    const { query, builtQuery } = this._toSQL();
    return this.session[isOneTimeQuery ? "prepareOneTimeQuery" : "prepareQuery"](
      builtQuery,
      void 0,
      this.mode === "first" ? "get" : "all",
      true,
      (rawRows, mapColumnValue) => {
        const rows = rawRows.map(
          (row) => mapRelationalRow(this.schema, this.tableConfig, row, query.selection, mapColumnValue)
        );
        if (this.mode === "first") {
          return rows[0];
        }
        return rows;
      }
    );
  }
  prepare() {
    return this._prepare(false);
  }
  _toSQL() {
    const query = this.dialect.buildRelationalQuery({
      fullSchema: this.fullSchema,
      schema: this.schema,
      tableNamesMap: this.tableNamesMap,
      table: this.table,
      tableConfig: this.tableConfig,
      queryConfig: this.config,
      tableAlias: this.tableConfig.tsName
    });
    const builtQuery = this.dialect.sqlToQuery(query.sql);
    return { query, builtQuery };
  }
  toSQL() {
    return this._toSQL().builtQuery;
  }
  /** @internal */
  executeRaw() {
    if (this.mode === "first") {
      return this._prepare(false).get();
    }
    return this._prepare(false).all();
  }
  async execute() {
    return this.executeRaw();
  }
}
class SQLiteSyncRelationalQuery extends SQLiteRelationalQuery {
  static [entityKind] = "SQLiteSyncRelationalQuery";
  sync() {
    return this.executeRaw();
  }
}

class SQLiteRaw extends QueryPromise {
  constructor(execute, getSQL, action, dialect, mapBatchResult) {
    super();
    this.execute = execute;
    this.getSQL = getSQL;
    this.dialect = dialect;
    this.mapBatchResult = mapBatchResult;
    this.config = { action };
  }
  static [entityKind] = "SQLiteRaw";
  /** @internal */
  config;
  getQuery() {
    return { ...this.dialect.sqlToQuery(this.getSQL()), method: this.config.action };
  }
  mapResult(result, isFromBatch) {
    return isFromBatch ? this.mapBatchResult(result) : result;
  }
  _prepare() {
    return this;
  }
  /** @internal */
  isResponseInArrayMode() {
    return false;
  }
}

class BaseSQLiteDatabase {
  constructor(resultKind, dialect, session, schema) {
    this.resultKind = resultKind;
    this.dialect = dialect;
    this.session = session;
    this._ = schema ? {
      schema: schema.schema,
      fullSchema: schema.fullSchema,
      tableNamesMap: schema.tableNamesMap
    } : {
      schema: void 0,
      fullSchema: {},
      tableNamesMap: {}
    };
    this.query = {};
    const query = this.query;
    if (this._.schema) {
      for (const [tableName, columns] of Object.entries(this._.schema)) {
        query[tableName] = new RelationalQueryBuilder(
          resultKind,
          schema.fullSchema,
          this._.schema,
          this._.tableNamesMap,
          schema.fullSchema[tableName],
          columns,
          dialect,
          session
        );
      }
    }
    this.$cache = { invalidate: async (_params) => {
    } };
  }
  static [entityKind] = "BaseSQLiteDatabase";
  query;
  /**
   * Creates a subquery that defines a temporary named result set as a CTE.
   *
   * It is useful for breaking down complex queries into simpler parts and for reusing the result set in subsequent parts of the query.
   *
   * See docs: {@link https://orm.drizzle.team/docs/select#with-clause}
   *
   * @param alias The alias for the subquery.
   *
   * Failure to provide an alias will result in a DrizzleTypeError, preventing the subquery from being referenced in other queries.
   *
   * @example
   *
   * ```ts
   * // Create a subquery with alias 'sq' and use it in the select query
   * const sq = db.$with('sq').as(db.select().from(users).where(eq(users.id, 42)));
   *
   * const result = await db.with(sq).select().from(sq);
   * ```
   *
   * To select arbitrary SQL values as fields in a CTE and reference them in other CTEs or in the main query, you need to add aliases to them:
   *
   * ```ts
   * // Select an arbitrary SQL value as a field in a CTE and reference it in the main query
   * const sq = db.$with('sq').as(db.select({
   *   name: sql<string>`upper(${users.name})`.as('name'),
   * })
   * .from(users));
   *
   * const result = await db.with(sq).select({ name: sq.name }).from(sq);
   * ```
   */
  $with = (alias, selection) => {
    const self = this;
    const as = (qb) => {
      if (typeof qb === "function") {
        qb = qb(new QueryBuilder(self.dialect));
      }
      return new Proxy(
        new WithSubquery(
          qb.getSQL(),
          selection ?? ("getSelectedFields" in qb ? qb.getSelectedFields() ?? {} : {}),
          alias,
          true
        ),
        new SelectionProxyHandler({ alias, sqlAliasedBehavior: "alias", sqlBehavior: "error" })
      );
    };
    return { as };
  };
  $count(source, filters) {
    return new SQLiteCountBuilder({ source, filters, session: this.session });
  }
  /**
   * Incorporates a previously defined CTE (using `$with`) into the main query.
   *
   * This method allows the main query to reference a temporary named result set.
   *
   * See docs: {@link https://orm.drizzle.team/docs/select#with-clause}
   *
   * @param queries The CTEs to incorporate into the main query.
   *
   * @example
   *
   * ```ts
   * // Define a subquery 'sq' as a CTE using $with
   * const sq = db.$with('sq').as(db.select().from(users).where(eq(users.id, 42)));
   *
   * // Incorporate the CTE 'sq' into the main query and select from it
   * const result = await db.with(sq).select().from(sq);
   * ```
   */
  with(...queries) {
    const self = this;
    function select(fields) {
      return new SQLiteSelectBuilder({
        fields: fields ?? void 0,
        session: self.session,
        dialect: self.dialect,
        withList: queries
      });
    }
    function selectDistinct(fields) {
      return new SQLiteSelectBuilder({
        fields: fields ?? void 0,
        session: self.session,
        dialect: self.dialect,
        withList: queries,
        distinct: true
      });
    }
    function update(table) {
      return new SQLiteUpdateBuilder(table, self.session, self.dialect, queries);
    }
    function insert(into) {
      return new SQLiteInsertBuilder(into, self.session, self.dialect, queries);
    }
    function delete_(from) {
      return new SQLiteDeleteBase(from, self.session, self.dialect, queries);
    }
    return { select, selectDistinct, update, insert, delete: delete_ };
  }
  select(fields) {
    return new SQLiteSelectBuilder({ fields: fields ?? void 0, session: this.session, dialect: this.dialect });
  }
  selectDistinct(fields) {
    return new SQLiteSelectBuilder({
      fields: fields ?? void 0,
      session: this.session,
      dialect: this.dialect,
      distinct: true
    });
  }
  /**
   * Creates an update query.
   *
   * Calling this method without `.where()` clause will update all rows in a table. The `.where()` clause specifies which rows should be updated.
   *
   * Use `.set()` method to specify which values to update.
   *
   * See docs: {@link https://orm.drizzle.team/docs/update}
   *
   * @param table The table to update.
   *
   * @example
   *
   * ```ts
   * // Update all rows in the 'cars' table
   * await db.update(cars).set({ color: 'red' });
   *
   * // Update rows with filters and conditions
   * await db.update(cars).set({ color: 'red' }).where(eq(cars.brand, 'BMW'));
   *
   * // Update with returning clause
   * const updatedCar: Car[] = await db.update(cars)
   *   .set({ color: 'red' })
   *   .where(eq(cars.id, 1))
   *   .returning();
   * ```
   */
  update(table) {
    return new SQLiteUpdateBuilder(table, this.session, this.dialect);
  }
  $cache;
  /**
   * Creates an insert query.
   *
   * Calling this method will create new rows in a table. Use `.values()` method to specify which values to insert.
   *
   * See docs: {@link https://orm.drizzle.team/docs/insert}
   *
   * @param table The table to insert into.
   *
   * @example
   *
   * ```ts
   * // Insert one row
   * await db.insert(cars).values({ brand: 'BMW' });
   *
   * // Insert multiple rows
   * await db.insert(cars).values([{ brand: 'BMW' }, { brand: 'Porsche' }]);
   *
   * // Insert with returning clause
   * const insertedCar: Car[] = await db.insert(cars)
   *   .values({ brand: 'BMW' })
   *   .returning();
   * ```
   */
  insert(into) {
    return new SQLiteInsertBuilder(into, this.session, this.dialect);
  }
  /**
   * Creates a delete query.
   *
   * Calling this method without `.where()` clause will delete all rows in a table. The `.where()` clause specifies which rows should be deleted.
   *
   * See docs: {@link https://orm.drizzle.team/docs/delete}
   *
   * @param table The table to delete from.
   *
   * @example
   *
   * ```ts
   * // Delete all rows in the 'cars' table
   * await db.delete(cars);
   *
   * // Delete rows with filters and conditions
   * await db.delete(cars).where(eq(cars.color, 'green'));
   *
   * // Delete with returning clause
   * const deletedCar: Car[] = await db.delete(cars)
   *   .where(eq(cars.id, 1))
   *   .returning();
   * ```
   */
  delete(from) {
    return new SQLiteDeleteBase(from, this.session, this.dialect);
  }
  run(query) {
    const sequel = typeof query === "string" ? sql.raw(query) : query.getSQL();
    if (this.resultKind === "async") {
      return new SQLiteRaw(
        async () => this.session.run(sequel),
        () => sequel,
        "run",
        this.dialect,
        this.session.extractRawRunValueFromBatchResult.bind(this.session)
      );
    }
    return this.session.run(sequel);
  }
  all(query) {
    const sequel = typeof query === "string" ? sql.raw(query) : query.getSQL();
    if (this.resultKind === "async") {
      return new SQLiteRaw(
        async () => this.session.all(sequel),
        () => sequel,
        "all",
        this.dialect,
        this.session.extractRawAllValueFromBatchResult.bind(this.session)
      );
    }
    return this.session.all(sequel);
  }
  get(query) {
    const sequel = typeof query === "string" ? sql.raw(query) : query.getSQL();
    if (this.resultKind === "async") {
      return new SQLiteRaw(
        async () => this.session.get(sequel),
        () => sequel,
        "get",
        this.dialect,
        this.session.extractRawGetValueFromBatchResult.bind(this.session)
      );
    }
    return this.session.get(sequel);
  }
  values(query) {
    const sequel = typeof query === "string" ? sql.raw(query) : query.getSQL();
    if (this.resultKind === "async") {
      return new SQLiteRaw(
        async () => this.session.values(sequel),
        () => sequel,
        "values",
        this.dialect,
        this.session.extractRawValuesValueFromBatchResult.bind(this.session)
      );
    }
    return this.session.values(sequel);
  }
  transaction(transaction, config) {
    return this.session.transaction(transaction, config);
  }
}

class Cache {
  static [entityKind] = "Cache";
}
class NoopCache extends Cache {
  strategy() {
    return "all";
  }
  static [entityKind] = "NoopCache";
  async get(_key) {
    return void 0;
  }
  async put(_hashedQuery, _response, _tables, _config) {
  }
  async onMutate(_params) {
  }
}
async function hashQuery(sql, params) {
  const dataToHash = `${sql}-${JSON.stringify(params)}`;
  const encoder = new TextEncoder();
  const data = encoder.encode(dataToHash);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = [...new Uint8Array(hashBuffer)];
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  return hashHex;
}

class ExecuteResultSync extends QueryPromise {
  constructor(resultCb) {
    super();
    this.resultCb = resultCb;
  }
  static [entityKind] = "ExecuteResultSync";
  async execute() {
    return this.resultCb();
  }
  sync() {
    return this.resultCb();
  }
}
class SQLitePreparedQuery {
  constructor(mode, executeMethod, query, cache, queryMetadata, cacheConfig) {
    this.mode = mode;
    this.executeMethod = executeMethod;
    this.query = query;
    this.cache = cache;
    this.queryMetadata = queryMetadata;
    this.cacheConfig = cacheConfig;
    if (cache && cache.strategy() === "all" && cacheConfig === void 0) {
      this.cacheConfig = { enable: true, autoInvalidate: true };
    }
    if (!this.cacheConfig?.enable) {
      this.cacheConfig = void 0;
    }
  }
  static [entityKind] = "PreparedQuery";
  /** @internal */
  joinsNotNullableMap;
  /** @internal */
  async queryWithCache(queryString, params, query) {
    if (this.cache === void 0 || is(this.cache, NoopCache) || this.queryMetadata === void 0) {
      try {
        return await query();
      } catch (e) {
        throw new DrizzleQueryError(queryString, params, e);
      }
    }
    if (this.cacheConfig && !this.cacheConfig.enable) {
      try {
        return await query();
      } catch (e) {
        throw new DrizzleQueryError(queryString, params, e);
      }
    }
    if ((this.queryMetadata.type === "insert" || this.queryMetadata.type === "update" || this.queryMetadata.type === "delete") && this.queryMetadata.tables.length > 0) {
      try {
        const [res] = await Promise.all([
          query(),
          this.cache.onMutate({ tables: this.queryMetadata.tables })
        ]);
        return res;
      } catch (e) {
        throw new DrizzleQueryError(queryString, params, e);
      }
    }
    if (!this.cacheConfig) {
      try {
        return await query();
      } catch (e) {
        throw new DrizzleQueryError(queryString, params, e);
      }
    }
    if (this.queryMetadata.type === "select") {
      const fromCache = await this.cache.get(
        this.cacheConfig.tag ?? (await hashQuery(queryString, params)),
        this.queryMetadata.tables,
        this.cacheConfig.tag !== void 0,
        this.cacheConfig.autoInvalidate
      );
      if (fromCache === void 0) {
        let result;
        try {
          result = await query();
        } catch (e) {
          throw new DrizzleQueryError(queryString, params, e);
        }
        await this.cache.put(
          this.cacheConfig.tag ?? (await hashQuery(queryString, params)),
          result,
          // make sure we send tables that were used in a query only if user wants to invalidate it on each write
          this.cacheConfig.autoInvalidate ? this.queryMetadata.tables : [],
          this.cacheConfig.tag !== void 0,
          this.cacheConfig.config
        );
        return result;
      }
      return fromCache;
    }
    try {
      return await query();
    } catch (e) {
      throw new DrizzleQueryError(queryString, params, e);
    }
  }
  getQuery() {
    return this.query;
  }
  mapRunResult(result, _isFromBatch) {
    return result;
  }
  mapAllResult(_result, _isFromBatch) {
    throw new Error("Not implemented");
  }
  mapGetResult(_result, _isFromBatch) {
    throw new Error("Not implemented");
  }
  execute(placeholderValues) {
    if (this.mode === "async") {
      return this[this.executeMethod](placeholderValues);
    }
    return new ExecuteResultSync(() => this[this.executeMethod](placeholderValues));
  }
  mapResult(response, isFromBatch) {
    switch (this.executeMethod) {
      case "run": {
        return this.mapRunResult(response, isFromBatch);
      }
      case "all": {
        return this.mapAllResult(response, isFromBatch);
      }
      case "get": {
        return this.mapGetResult(response, isFromBatch);
      }
    }
  }
}
class SQLiteSession {
  constructor(dialect) {
    this.dialect = dialect;
  }
  static [entityKind] = "SQLiteSession";
  prepareOneTimeQuery(query, fields, executeMethod, isResponseInArrayMode, customResultMapper, queryMetadata, cacheConfig) {
    return this.prepareQuery(
      query,
      fields,
      executeMethod,
      isResponseInArrayMode,
      customResultMapper,
      queryMetadata,
      cacheConfig
    );
  }
  run(query) {
    const staticQuery = this.dialect.sqlToQuery(query);
    try {
      return this.prepareOneTimeQuery(staticQuery, void 0, "run", false).run();
    } catch (err) {
      throw new DrizzleError({ cause: err, message: `Failed to run the query '${staticQuery.sql}'` });
    }
  }
  /** @internal */
  extractRawRunValueFromBatchResult(result) {
    return result;
  }
  all(query) {
    return this.prepareOneTimeQuery(this.dialect.sqlToQuery(query), void 0, "run", false).all();
  }
  /** @internal */
  extractRawAllValueFromBatchResult(_result) {
    throw new Error("Not implemented");
  }
  get(query) {
    return this.prepareOneTimeQuery(this.dialect.sqlToQuery(query), void 0, "run", false).get();
  }
  /** @internal */
  extractRawGetValueFromBatchResult(_result) {
    throw new Error("Not implemented");
  }
  values(query) {
    return this.prepareOneTimeQuery(this.dialect.sqlToQuery(query), void 0, "run", false).values();
  }
  async count(sql) {
    const result = await this.values(sql);
    return result[0][0];
  }
  /** @internal */
  extractRawValuesValueFromBatchResult(_result) {
    throw new Error("Not implemented");
  }
}
class SQLiteTransaction extends BaseSQLiteDatabase {
  constructor(resultType, dialect, session, schema, nestedIndex = 0) {
    super(resultType, dialect, session, schema);
    this.schema = schema;
    this.nestedIndex = nestedIndex;
  }
  static [entityKind] = "SQLiteTransaction";
  rollback() {
    throw new TransactionRollbackError();
  }
}

class LibSQLSession extends SQLiteSession {
  constructor(client, dialect, schema, options, tx) {
    super(dialect);
    this.client = client;
    this.schema = schema;
    this.options = options;
    this.tx = tx;
    this.logger = options.logger ?? new NoopLogger();
    this.cache = options.cache ?? new NoopCache();
  }
  static [entityKind] = "LibSQLSession";
  logger;
  cache;
  prepareQuery(query, fields, executeMethod, isResponseInArrayMode, customResultMapper, queryMetadata, cacheConfig) {
    return new LibSQLPreparedQuery(
      this.client,
      query,
      this.logger,
      this.cache,
      queryMetadata,
      cacheConfig,
      fields,
      this.tx,
      executeMethod,
      isResponseInArrayMode,
      customResultMapper
    );
  }
  async batch(queries) {
    const preparedQueries = [];
    const builtQueries = [];
    for (const query of queries) {
      const preparedQuery = query._prepare();
      const builtQuery = preparedQuery.getQuery();
      preparedQueries.push(preparedQuery);
      builtQueries.push({ sql: builtQuery.sql, args: builtQuery.params });
    }
    const batchResults = await this.client.batch(builtQueries);
    return batchResults.map((result, i) => preparedQueries[i].mapResult(result, true));
  }
  async migrate(queries) {
    const preparedQueries = [];
    const builtQueries = [];
    for (const query of queries) {
      const preparedQuery = query._prepare();
      const builtQuery = preparedQuery.getQuery();
      preparedQueries.push(preparedQuery);
      builtQueries.push({ sql: builtQuery.sql, args: builtQuery.params });
    }
    const batchResults = await this.client.migrate(builtQueries);
    return batchResults.map((result, i) => preparedQueries[i].mapResult(result, true));
  }
  async transaction(transaction, _config) {
    const libsqlTx = await this.client.transaction();
    const session = new LibSQLSession(
      this.client,
      this.dialect,
      this.schema,
      this.options,
      libsqlTx
    );
    const tx = new LibSQLTransaction("async", this.dialect, session, this.schema);
    try {
      const result = await transaction(tx);
      await libsqlTx.commit();
      return result;
    } catch (err) {
      await libsqlTx.rollback();
      throw err;
    }
  }
  extractRawAllValueFromBatchResult(result) {
    return result.rows;
  }
  extractRawGetValueFromBatchResult(result) {
    return result.rows[0];
  }
  extractRawValuesValueFromBatchResult(result) {
    return result.rows;
  }
}
class LibSQLTransaction extends SQLiteTransaction {
  static [entityKind] = "LibSQLTransaction";
  async transaction(transaction) {
    const savepointName = `sp${this.nestedIndex}`;
    const tx = new LibSQLTransaction("async", this.dialect, this.session, this.schema, this.nestedIndex + 1);
    await this.session.run(sql.raw(`savepoint ${savepointName}`));
    try {
      const result = await transaction(tx);
      await this.session.run(sql.raw(`release savepoint ${savepointName}`));
      return result;
    } catch (err) {
      await this.session.run(sql.raw(`rollback to savepoint ${savepointName}`));
      throw err;
    }
  }
}
class LibSQLPreparedQuery extends SQLitePreparedQuery {
  constructor(client, query, logger, cache, queryMetadata, cacheConfig, fields, tx, executeMethod, _isResponseInArrayMode, customResultMapper) {
    super("async", executeMethod, query, cache, queryMetadata, cacheConfig);
    this.client = client;
    this.logger = logger;
    this.fields = fields;
    this.tx = tx;
    this._isResponseInArrayMode = _isResponseInArrayMode;
    this.customResultMapper = customResultMapper;
    this.customResultMapper = customResultMapper;
    this.fields = fields;
  }
  static [entityKind] = "LibSQLPreparedQuery";
  async run(placeholderValues) {
    const params = fillPlaceholders(this.query.params, placeholderValues ?? {});
    this.logger.logQuery(this.query.sql, params);
    return await this.queryWithCache(this.query.sql, params, async () => {
      const stmt = { sql: this.query.sql, args: params };
      return this.tx ? this.tx.execute(stmt) : this.client.execute(stmt);
    });
  }
  async all(placeholderValues) {
    const { fields, logger, query, tx, client, customResultMapper } = this;
    if (!fields && !customResultMapper) {
      const params = fillPlaceholders(query.params, placeholderValues ?? {});
      logger.logQuery(query.sql, params);
      return await this.queryWithCache(query.sql, params, async () => {
        const stmt = { sql: query.sql, args: params };
        return (tx ? tx.execute(stmt) : client.execute(stmt)).then(({ rows: rows2 }) => this.mapAllResult(rows2));
      });
    }
    const rows = await this.values(placeholderValues);
    return this.mapAllResult(rows);
  }
  mapAllResult(rows, isFromBatch) {
    if (isFromBatch) {
      rows = rows.rows;
    }
    if (!this.fields && !this.customResultMapper) {
      return rows.map((row) => normalizeRow(row));
    }
    if (this.customResultMapper) {
      return this.customResultMapper(rows, normalizeFieldValue);
    }
    return rows.map((row) => {
      return mapResultRow(
        this.fields,
        Array.prototype.slice.call(row).map((v) => normalizeFieldValue(v)),
        this.joinsNotNullableMap
      );
    });
  }
  async get(placeholderValues) {
    const { fields, logger, query, tx, client, customResultMapper } = this;
    if (!fields && !customResultMapper) {
      const params = fillPlaceholders(query.params, placeholderValues ?? {});
      logger.logQuery(query.sql, params);
      return await this.queryWithCache(query.sql, params, async () => {
        const stmt = { sql: query.sql, args: params };
        return (tx ? tx.execute(stmt) : client.execute(stmt)).then(({ rows: rows2 }) => this.mapGetResult(rows2));
      });
    }
    const rows = await this.values(placeholderValues);
    return this.mapGetResult(rows);
  }
  mapGetResult(rows, isFromBatch) {
    if (isFromBatch) {
      rows = rows.rows;
    }
    const row = rows[0];
    if (!this.fields && !this.customResultMapper) {
      return normalizeRow(row);
    }
    if (!row) {
      return void 0;
    }
    if (this.customResultMapper) {
      return this.customResultMapper(rows, normalizeFieldValue);
    }
    return mapResultRow(
      this.fields,
      Array.prototype.slice.call(row).map((v) => normalizeFieldValue(v)),
      this.joinsNotNullableMap
    );
  }
  async values(placeholderValues) {
    const params = fillPlaceholders(this.query.params, placeholderValues ?? {});
    this.logger.logQuery(this.query.sql, params);
    return await this.queryWithCache(this.query.sql, params, async () => {
      const stmt = { sql: this.query.sql, args: params };
      return (this.tx ? this.tx.execute(stmt) : this.client.execute(stmt)).then(({ rows }) => rows);
    });
  }
  /** @internal */
  isResponseInArrayMode() {
    return this._isResponseInArrayMode;
  }
}
function normalizeRow(obj) {
  return Object.keys(obj).reduce((acc, key) => {
    if (Object.prototype.propertyIsEnumerable.call(obj, key)) {
      acc[key] = obj[key];
    }
    return acc;
  }, {});
}
function normalizeFieldValue(value) {
  if (typeof ArrayBuffer !== "undefined" && value instanceof ArrayBuffer) {
    if (typeof Buffer !== "undefined") {
      if (!(value instanceof Buffer)) {
        return Buffer.from(value);
      }
      return value;
    }
    if (typeof TextDecoder !== "undefined") {
      return new TextDecoder().decode(value);
    }
    throw new Error("TextDecoder is not available. Please provide either Buffer or TextDecoder polyfill.");
  }
  return value;
}

class LibSQLDatabase extends BaseSQLiteDatabase {
  static [entityKind] = "LibSQLDatabase";
  async batch(batch) {
    return this.session.batch(batch);
  }
}
function construct(client, config = {}) {
  const dialect = new SQLiteAsyncDialect({ casing: config.casing });
  let logger;
  if (config.logger === true) {
    logger = new DefaultLogger();
  } else if (config.logger !== false) {
    logger = config.logger;
  }
  let schema;
  if (config.schema) {
    const tablesConfig = extractTablesRelationalConfig(
      config.schema,
      createTableRelationsHelpers
    );
    schema = {
      fullSchema: config.schema,
      schema: tablesConfig.tables,
      tableNamesMap: tablesConfig.tableNamesMap
    };
  }
  const session = new LibSQLSession(client, dialect, schema, { logger, cache: config.cache }, void 0);
  const db = new LibSQLDatabase("async", dialect, session, schema);
  db.$client = client;
  db.$cache = config.cache;
  if (db.$cache) {
    db.$cache["invalidate"] = config.cache?.onMutate;
  }
  return db;
}

function drizzle(...params) {
  if (typeof params[0] === "string") {
    const instance = createClient({
      url: params[0]
    });
    return construct(instance, params[1]);
  }
  if (isConfig(params[0])) {
    const { connection, client, ...drizzleConfig } = params[0];
    if (client) return construct(client, drizzleConfig);
    const instance = typeof connection === "string" ? createClient({ url: connection }) : createClient(connection);
    return construct(instance, drizzleConfig);
  }
  return construct(params[0], params[1]);
}
((drizzle2) => {
  function mock(config) {
    return construct({}, config);
  }
  drizzle2.mock = mock;
})(drizzle || (drizzle = {}));

const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  name: text("name"),
  emailVerified: integer("email_verified", { mode: "boolean" }).notNull().default(false),
  image: text("image"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`)
});
const sessions = sqliteTable("sessions", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`)
});
const magicLinkTokens = sqliteTable("magic_link_tokens", {
  id: text("id").primaryKey(),
  email: text("email").notNull(),
  token: text("token").notNull().unique(),
  expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
  used: integer("used", { mode: "boolean" }).notNull().default(false),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`)
});
const quotes = sqliteTable(
  "quotes",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    // User relation (optional)
    userId: text("user_id").references(() => users.id, { onDelete: "set null" }),
    // Version control
    schemaVersion: integer("schema_version").notNull().default(1),
    // Fingerprint for duplicate prevention
    fingerprint: text("fingerprint").notNull().unique(),
    // Calculator data (JSON)
    calculatorData: text("calculator_data", { mode: "json" }).$type().notNull(),
    // Result
    totalPrice: real("total_price").notNull(),
    currency: text("currency").notNull().default("HUF"),
    breakdown: text("breakdown", { mode: "json" }).$type(),
    // Contact info
    name: text("name"),
    email: text("email"),
    phone: text("phone"),
    // Language
    language: text("language").notNull().default("en"),
    // Enrichment data
    ipAddress: text("ip_address"),
    // Nullable (GDPR)
    ipAddressHash: text("ip_address_hash"),
    // Hashed IP (GDPR-safe)
    country: text("country"),
    city: text("city"),
    device: text("device"),
    userAgent: text("user_agent"),
    // Marketing tracking
    utmSource: text("utm_source"),
    utmMedium: text("utm_medium"),
    utmCampaign: text("utm_campaign"),
    utmTerm: text("utm_term"),
    utmContent: text("utm_content"),
    gclid: text("gclid"),
    // Status
    status: text("status").notNull().default("new"),
    // CRM sync
    crmSynced: integer("crm_synced", { mode: "boolean" }).notNull().default(false),
    crmId: text("crm_id"),
    crmSyncedAt: integer("crm_synced_at", { mode: "timestamp" }),
    crmSyncAttempts: integer("crm_sync_attempts").notNull().default(0),
    // Timestamps
    createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
    updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
    // Soft delete for GDPR
    deletedAt: integer("deleted_at", { mode: "timestamp" })
  },
  (table) => ({
    // Indexes for performance
    fingerprintIdx: index("fingerprint_idx").on(table.fingerprint),
    createdAtIdx: index("created_at_idx").on(table.createdAt),
    statusIdx: index("status_idx").on(table.status),
    crmSyncedIdx: index("crm_synced_idx").on(table.crmSynced),
    emailIdx: index("email_idx").on(table.email)
  })
);
const crmQueue = sqliteTable("crm_queue", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  quoteId: integer("quote_id").notNull().references(() => quotes.id, { onDelete: "cascade" }),
  attempts: integer("attempts").notNull().default(0),
  maxAttempts: integer("max_attempts").notNull().default(3),
  nextRetryAt: integer("next_retry_at", { mode: "timestamp" }),
  lastError: text("last_error"),
  status: text("status").notNull().default("pending"),
  // 'pending' | 'processing' | 'completed' | 'failed'
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
  processedAt: integer("processed_at", { mode: "timestamp" })
});
const testimonials = sqliteTable("testimonials", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  company: text("company"),
  role: text("role"),
  content: text("content").notNull(),
  rating: integer("rating").notNull(),
  image: text("image"),
  // Assignment
  pages: text("pages", { mode: "json" }).$type(),
  // Display settings
  featured: integer("featured", { mode: "boolean" }).notNull().default(false),
  active: integer("active", { mode: "boolean" }).notNull().default(true),
  order: integer("order").notNull().default(0),
  // Language
  language: text("language").notNull().default("en"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`)
});

const schema = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
    __proto__: null,
    crmQueue,
    magicLinkTokens,
    quotes,
    sessions,
    testimonials,
    users
}, Symbol.toStringTag, { value: 'Module' }));

function createDbClient(credentials) {
  const { TURSO_DATABASE_URL, TURSO_AUTH_TOKEN } = credentials;
  if (!TURSO_DATABASE_URL || !TURSO_AUTH_TOKEN) {
    logger.error("DB", "Missing database credentials");
    throw new Error("Database credentials not configured");
  }
  try {
    const client = createClient({
      url: TURSO_DATABASE_URL,
      authToken: TURSO_AUTH_TOKEN
    });
    const db = drizzle(client, { schema });
    logger.debug("DB", "Client created successfully");
    return db;
  } catch (error) {
    logger.error("DB", "Failed to create client", { error });
    throw error;
  }
}

async function createQuote(db, data) {
  try {
    const result = await db.insert(quotes).values(data).returning().get();
    logger.info("DB", "Quote created", { id: result.id });
    return result;
  } catch (error) {
    logger.error("DB", "Failed to create quote", { error });
    return null;
  }
}
async function getQuoteById(db, id) {
  try {
    const result = await db.select().from(quotes).where(eq(quotes.id, id)).get();
    return result || null;
  } catch (error) {
    logger.error("DB", "Failed to get quote", { error, id });
    return null;
  }
}
async function getQuoteByFingerprint(db, fingerprint) {
  try {
    const result = await db.select().from(quotes).where(eq(quotes.fingerprint, fingerprint)).get();
    return result || null;
  } catch (error) {
    logger.error("DB", "Failed to get quote by fingerprint", { error });
    return null;
  }
}

export { getQuoteByFingerprint as a, createQuote as b, createDbClient as c, getQuoteById as g };
