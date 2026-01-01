module.exports = [
"[project]/Documents/GitHub/buenasv2/node_modules/bcryptjs/index.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/*
 Copyright (c) 2012 Nevins Bartolomeo <nevins.bartolomeo@gmail.com>
 Copyright (c) 2012 Shane Girish <shaneGirish@gmail.com>
 Copyright (c) 2025 Daniel Wirtz <dcode@dcode.io>

 Redistribution and use in source and binary forms, with or without
 modification, are permitted provided that the following conditions
 are met:
 1. Redistributions of source code must retain the above copyright
 notice, this list of conditions and the following disclaimer.
 2. Redistributions in binary form must reproduce the above copyright
 notice, this list of conditions and the following disclaimer in the
 documentation and/or other materials provided with the distribution.
 3. The name of the author may not be used to endorse or promote products
 derived from this software without specific prior written permission.

 THIS SOFTWARE IS PROVIDED BY THE AUTHOR ``AS IS'' AND ANY EXPRESS OR
 IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES
 OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED.
 IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY DIRECT, INDIRECT,
 INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT
 NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
 DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
 THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF
 THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */ // The Node.js crypto module is used as a fallback for the Web Crypto API. When
// building for the browser, inclusion of the crypto module should be disabled,
// which the package hints at in its package.json for bundlers that support it.
__turbopack_context__.s([
    "compare",
    ()=>compare,
    "compareSync",
    ()=>compareSync,
    "decodeBase64",
    ()=>decodeBase64,
    "default",
    ()=>__TURBOPACK__default__export__,
    "encodeBase64",
    ()=>encodeBase64,
    "genSalt",
    ()=>genSalt,
    "genSaltSync",
    ()=>genSaltSync,
    "getRounds",
    ()=>getRounds,
    "getSalt",
    ()=>getSalt,
    "hash",
    ()=>hash,
    "hashSync",
    ()=>hashSync,
    "setRandomFallback",
    ()=>setRandomFallback,
    "truncates",
    ()=>truncates
]);
var __TURBOPACK__imported__module__$5b$externals$5d2f$crypto__$5b$external$5d$__$28$crypto$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/crypto [external] (crypto, cjs)");
;
/**
 * The random implementation to use as a fallback.
 * @type {?function(number):!Array.<number>}
 * @inner
 */ var randomFallback = null;
/**
 * Generates cryptographically secure random bytes.
 * @function
 * @param {number} len Bytes length
 * @returns {!Array.<number>} Random bytes
 * @throws {Error} If no random implementation is available
 * @inner
 */ function randomBytes(len) {
    // Web Crypto API. Globally available in the browser and in Node.js >=23.
    try {
        return crypto.getRandomValues(new Uint8Array(len));
    } catch  {}
    // Node.js crypto module for non-browser environments.
    try {
        return __TURBOPACK__imported__module__$5b$externals$5d2f$crypto__$5b$external$5d$__$28$crypto$2c$__cjs$29$__["default"].randomBytes(len);
    } catch  {}
    // Custom fallback specified with `setRandomFallback`.
    if (!randomFallback) {
        throw Error("Neither WebCryptoAPI nor a crypto module is available. Use bcrypt.setRandomFallback to set an alternative");
    }
    return randomFallback(len);
}
function setRandomFallback(random) {
    randomFallback = random;
}
function genSaltSync(rounds, seed_length) {
    rounds = rounds || GENSALT_DEFAULT_LOG2_ROUNDS;
    if (typeof rounds !== "number") throw Error("Illegal arguments: " + typeof rounds + ", " + typeof seed_length);
    if (rounds < 4) rounds = 4;
    else if (rounds > 31) rounds = 31;
    var salt = [];
    salt.push("$2b$");
    if (rounds < 10) salt.push("0");
    salt.push(rounds.toString());
    salt.push("$");
    salt.push(base64_encode(randomBytes(BCRYPT_SALT_LEN), BCRYPT_SALT_LEN)); // May throw
    return salt.join("");
}
function genSalt(rounds, seed_length, callback) {
    if (typeof seed_length === "function") callback = seed_length, seed_length = undefined; // Not supported.
    if (typeof rounds === "function") callback = rounds, rounds = undefined;
    if (typeof rounds === "undefined") rounds = GENSALT_DEFAULT_LOG2_ROUNDS;
    else if (typeof rounds !== "number") throw Error("illegal arguments: " + typeof rounds);
    function _async(callback) {
        nextTick(function() {
            // Pretty thin, but salting is fast enough
            try {
                callback(null, genSaltSync(rounds));
            } catch (err) {
                callback(err);
            }
        });
    }
    if (callback) {
        if (typeof callback !== "function") throw Error("Illegal callback: " + typeof callback);
        _async(callback);
    } else return new Promise(function(resolve, reject) {
        _async(function(err, res) {
            if (err) {
                reject(err);
                return;
            }
            resolve(res);
        });
    });
}
function hashSync(password, salt) {
    if (typeof salt === "undefined") salt = GENSALT_DEFAULT_LOG2_ROUNDS;
    if (typeof salt === "number") salt = genSaltSync(salt);
    if (typeof password !== "string" || typeof salt !== "string") throw Error("Illegal arguments: " + typeof password + ", " + typeof salt);
    return _hash(password, salt);
}
function hash(password, salt, callback, progressCallback) {
    function _async(callback) {
        if (typeof password === "string" && typeof salt === "number") genSalt(salt, function(err, salt) {
            _hash(password, salt, callback, progressCallback);
        });
        else if (typeof password === "string" && typeof salt === "string") _hash(password, salt, callback, progressCallback);
        else nextTick(callback.bind(this, Error("Illegal arguments: " + typeof password + ", " + typeof salt)));
    }
    if (callback) {
        if (typeof callback !== "function") throw Error("Illegal callback: " + typeof callback);
        _async(callback);
    } else return new Promise(function(resolve, reject) {
        _async(function(err, res) {
            if (err) {
                reject(err);
                return;
            }
            resolve(res);
        });
    });
}
/**
 * Compares two strings of the same length in constant time.
 * @param {string} known Must be of the correct length
 * @param {string} unknown Must be the same length as `known`
 * @returns {boolean}
 * @inner
 */ function safeStringCompare(known, unknown) {
    var diff = known.length ^ unknown.length;
    for(var i = 0; i < known.length; ++i){
        diff |= known.charCodeAt(i) ^ unknown.charCodeAt(i);
    }
    return diff === 0;
}
function compareSync(password, hash) {
    if (typeof password !== "string" || typeof hash !== "string") throw Error("Illegal arguments: " + typeof password + ", " + typeof hash);
    if (hash.length !== 60) return false;
    return safeStringCompare(hashSync(password, hash.substring(0, hash.length - 31)), hash);
}
function compare(password, hashValue, callback, progressCallback) {
    function _async(callback) {
        if (typeof password !== "string" || typeof hashValue !== "string") {
            nextTick(callback.bind(this, Error("Illegal arguments: " + typeof password + ", " + typeof hashValue)));
            return;
        }
        if (hashValue.length !== 60) {
            nextTick(callback.bind(this, null, false));
            return;
        }
        hash(password, hashValue.substring(0, 29), function(err, comp) {
            if (err) callback(err);
            else callback(null, safeStringCompare(comp, hashValue));
        }, progressCallback);
    }
    if (callback) {
        if (typeof callback !== "function") throw Error("Illegal callback: " + typeof callback);
        _async(callback);
    } else return new Promise(function(resolve, reject) {
        _async(function(err, res) {
            if (err) {
                reject(err);
                return;
            }
            resolve(res);
        });
    });
}
function getRounds(hash) {
    if (typeof hash !== "string") throw Error("Illegal arguments: " + typeof hash);
    return parseInt(hash.split("$")[2], 10);
}
function getSalt(hash) {
    if (typeof hash !== "string") throw Error("Illegal arguments: " + typeof hash);
    if (hash.length !== 60) throw Error("Illegal hash length: " + hash.length + " != 60");
    return hash.substring(0, 29);
}
function truncates(password) {
    if (typeof password !== "string") throw Error("Illegal arguments: " + typeof password);
    return utf8Length(password) > 72;
}
/**
 * Continues with the callback after yielding to the event loop.
 * @function
 * @param {function(...[*])} callback Callback to execute
 * @inner
 */ var nextTick = typeof setImmediate === "function" ? setImmediate : typeof scheduler === "object" && typeof scheduler.postTask === "function" ? scheduler.postTask.bind(scheduler) : setTimeout;
/** Calculates the byte length of a string encoded as UTF8. */ function utf8Length(string) {
    var len = 0, c = 0;
    for(var i = 0; i < string.length; ++i){
        c = string.charCodeAt(i);
        if (c < 128) len += 1;
        else if (c < 2048) len += 2;
        else if ((c & 0xfc00) === 0xd800 && (string.charCodeAt(i + 1) & 0xfc00) === 0xdc00) {
            ++i;
            len += 4;
        } else len += 3;
    }
    return len;
}
/** Converts a string to an array of UTF8 bytes. */ function utf8Array(string) {
    var offset = 0, c1, c2;
    var buffer = new Array(utf8Length(string));
    for(var i = 0, k = string.length; i < k; ++i){
        c1 = string.charCodeAt(i);
        if (c1 < 128) {
            buffer[offset++] = c1;
        } else if (c1 < 2048) {
            buffer[offset++] = c1 >> 6 | 192;
            buffer[offset++] = c1 & 63 | 128;
        } else if ((c1 & 0xfc00) === 0xd800 && ((c2 = string.charCodeAt(i + 1)) & 0xfc00) === 0xdc00) {
            c1 = 0x10000 + ((c1 & 0x03ff) << 10) + (c2 & 0x03ff);
            ++i;
            buffer[offset++] = c1 >> 18 | 240;
            buffer[offset++] = c1 >> 12 & 63 | 128;
            buffer[offset++] = c1 >> 6 & 63 | 128;
            buffer[offset++] = c1 & 63 | 128;
        } else {
            buffer[offset++] = c1 >> 12 | 224;
            buffer[offset++] = c1 >> 6 & 63 | 128;
            buffer[offset++] = c1 & 63 | 128;
        }
    }
    return buffer;
}
// A base64 implementation for the bcrypt algorithm. This is partly non-standard.
/**
 * bcrypt's own non-standard base64 dictionary.
 * @type {!Array.<string>}
 * @const
 * @inner
 **/ var BASE64_CODE = "./ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789".split("");
/**
 * @type {!Array.<number>}
 * @const
 * @inner
 **/ var BASE64_INDEX = [
    -1,
    -1,
    -1,
    -1,
    -1,
    -1,
    -1,
    -1,
    -1,
    -1,
    -1,
    -1,
    -1,
    -1,
    -1,
    -1,
    -1,
    -1,
    -1,
    -1,
    -1,
    -1,
    -1,
    -1,
    -1,
    -1,
    -1,
    -1,
    -1,
    -1,
    -1,
    -1,
    -1,
    -1,
    -1,
    -1,
    -1,
    -1,
    -1,
    -1,
    -1,
    -1,
    -1,
    -1,
    -1,
    -1,
    0,
    1,
    54,
    55,
    56,
    57,
    58,
    59,
    60,
    61,
    62,
    63,
    -1,
    -1,
    -1,
    -1,
    -1,
    -1,
    -1,
    2,
    3,
    4,
    5,
    6,
    7,
    8,
    9,
    10,
    11,
    12,
    13,
    14,
    15,
    16,
    17,
    18,
    19,
    20,
    21,
    22,
    23,
    24,
    25,
    26,
    27,
    -1,
    -1,
    -1,
    -1,
    -1,
    -1,
    28,
    29,
    30,
    31,
    32,
    33,
    34,
    35,
    36,
    37,
    38,
    39,
    40,
    41,
    42,
    43,
    44,
    45,
    46,
    47,
    48,
    49,
    50,
    51,
    52,
    53,
    -1,
    -1,
    -1,
    -1,
    -1
];
/**
 * Encodes a byte array to base64 with up to len bytes of input.
 * @param {!Array.<number>} b Byte array
 * @param {number} len Maximum input length
 * @returns {string}
 * @inner
 */ function base64_encode(b, len) {
    var off = 0, rs = [], c1, c2;
    if (len <= 0 || len > b.length) throw Error("Illegal len: " + len);
    while(off < len){
        c1 = b[off++] & 0xff;
        rs.push(BASE64_CODE[c1 >> 2 & 0x3f]);
        c1 = (c1 & 0x03) << 4;
        if (off >= len) {
            rs.push(BASE64_CODE[c1 & 0x3f]);
            break;
        }
        c2 = b[off++] & 0xff;
        c1 |= c2 >> 4 & 0x0f;
        rs.push(BASE64_CODE[c1 & 0x3f]);
        c1 = (c2 & 0x0f) << 2;
        if (off >= len) {
            rs.push(BASE64_CODE[c1 & 0x3f]);
            break;
        }
        c2 = b[off++] & 0xff;
        c1 |= c2 >> 6 & 0x03;
        rs.push(BASE64_CODE[c1 & 0x3f]);
        rs.push(BASE64_CODE[c2 & 0x3f]);
    }
    return rs.join("");
}
/**
 * Decodes a base64 encoded string to up to len bytes of output.
 * @param {string} s String to decode
 * @param {number} len Maximum output length
 * @returns {!Array.<number>}
 * @inner
 */ function base64_decode(s, len) {
    var off = 0, slen = s.length, olen = 0, rs = [], c1, c2, c3, c4, o, code;
    if (len <= 0) throw Error("Illegal len: " + len);
    while(off < slen - 1 && olen < len){
        code = s.charCodeAt(off++);
        c1 = code < BASE64_INDEX.length ? BASE64_INDEX[code] : -1;
        code = s.charCodeAt(off++);
        c2 = code < BASE64_INDEX.length ? BASE64_INDEX[code] : -1;
        if (c1 == -1 || c2 == -1) break;
        o = c1 << 2 >>> 0;
        o |= (c2 & 0x30) >> 4;
        rs.push(String.fromCharCode(o));
        if (++olen >= len || off >= slen) break;
        code = s.charCodeAt(off++);
        c3 = code < BASE64_INDEX.length ? BASE64_INDEX[code] : -1;
        if (c3 == -1) break;
        o = (c2 & 0x0f) << 4 >>> 0;
        o |= (c3 & 0x3c) >> 2;
        rs.push(String.fromCharCode(o));
        if (++olen >= len || off >= slen) break;
        code = s.charCodeAt(off++);
        c4 = code < BASE64_INDEX.length ? BASE64_INDEX[code] : -1;
        o = (c3 & 0x03) << 6 >>> 0;
        o |= c4;
        rs.push(String.fromCharCode(o));
        ++olen;
    }
    var res = [];
    for(off = 0; off < olen; off++)res.push(rs[off].charCodeAt(0));
    return res;
}
/**
 * @type {number}
 * @const
 * @inner
 */ var BCRYPT_SALT_LEN = 16;
/**
 * @type {number}
 * @const
 * @inner
 */ var GENSALT_DEFAULT_LOG2_ROUNDS = 10;
/**
 * @type {number}
 * @const
 * @inner
 */ var BLOWFISH_NUM_ROUNDS = 16;
/**
 * @type {number}
 * @const
 * @inner
 */ var MAX_EXECUTION_TIME = 100;
/**
 * @type {Array.<number>}
 * @const
 * @inner
 */ var P_ORIG = [
    0x243f6a88,
    0x85a308d3,
    0x13198a2e,
    0x03707344,
    0xa4093822,
    0x299f31d0,
    0x082efa98,
    0xec4e6c89,
    0x452821e6,
    0x38d01377,
    0xbe5466cf,
    0x34e90c6c,
    0xc0ac29b7,
    0xc97c50dd,
    0x3f84d5b5,
    0xb5470917,
    0x9216d5d9,
    0x8979fb1b
];
/**
 * @type {Array.<number>}
 * @const
 * @inner
 */ var S_ORIG = [
    0xd1310ba6,
    0x98dfb5ac,
    0x2ffd72db,
    0xd01adfb7,
    0xb8e1afed,
    0x6a267e96,
    0xba7c9045,
    0xf12c7f99,
    0x24a19947,
    0xb3916cf7,
    0x0801f2e2,
    0x858efc16,
    0x636920d8,
    0x71574e69,
    0xa458fea3,
    0xf4933d7e,
    0x0d95748f,
    0x728eb658,
    0x718bcd58,
    0x82154aee,
    0x7b54a41d,
    0xc25a59b5,
    0x9c30d539,
    0x2af26013,
    0xc5d1b023,
    0x286085f0,
    0xca417918,
    0xb8db38ef,
    0x8e79dcb0,
    0x603a180e,
    0x6c9e0e8b,
    0xb01e8a3e,
    0xd71577c1,
    0xbd314b27,
    0x78af2fda,
    0x55605c60,
    0xe65525f3,
    0xaa55ab94,
    0x57489862,
    0x63e81440,
    0x55ca396a,
    0x2aab10b6,
    0xb4cc5c34,
    0x1141e8ce,
    0xa15486af,
    0x7c72e993,
    0xb3ee1411,
    0x636fbc2a,
    0x2ba9c55d,
    0x741831f6,
    0xce5c3e16,
    0x9b87931e,
    0xafd6ba33,
    0x6c24cf5c,
    0x7a325381,
    0x28958677,
    0x3b8f4898,
    0x6b4bb9af,
    0xc4bfe81b,
    0x66282193,
    0x61d809cc,
    0xfb21a991,
    0x487cac60,
    0x5dec8032,
    0xef845d5d,
    0xe98575b1,
    0xdc262302,
    0xeb651b88,
    0x23893e81,
    0xd396acc5,
    0x0f6d6ff3,
    0x83f44239,
    0x2e0b4482,
    0xa4842004,
    0x69c8f04a,
    0x9e1f9b5e,
    0x21c66842,
    0xf6e96c9a,
    0x670c9c61,
    0xabd388f0,
    0x6a51a0d2,
    0xd8542f68,
    0x960fa728,
    0xab5133a3,
    0x6eef0b6c,
    0x137a3be4,
    0xba3bf050,
    0x7efb2a98,
    0xa1f1651d,
    0x39af0176,
    0x66ca593e,
    0x82430e88,
    0x8cee8619,
    0x456f9fb4,
    0x7d84a5c3,
    0x3b8b5ebe,
    0xe06f75d8,
    0x85c12073,
    0x401a449f,
    0x56c16aa6,
    0x4ed3aa62,
    0x363f7706,
    0x1bfedf72,
    0x429b023d,
    0x37d0d724,
    0xd00a1248,
    0xdb0fead3,
    0x49f1c09b,
    0x075372c9,
    0x80991b7b,
    0x25d479d8,
    0xf6e8def7,
    0xe3fe501a,
    0xb6794c3b,
    0x976ce0bd,
    0x04c006ba,
    0xc1a94fb6,
    0x409f60c4,
    0x5e5c9ec2,
    0x196a2463,
    0x68fb6faf,
    0x3e6c53b5,
    0x1339b2eb,
    0x3b52ec6f,
    0x6dfc511f,
    0x9b30952c,
    0xcc814544,
    0xaf5ebd09,
    0xbee3d004,
    0xde334afd,
    0x660f2807,
    0x192e4bb3,
    0xc0cba857,
    0x45c8740f,
    0xd20b5f39,
    0xb9d3fbdb,
    0x5579c0bd,
    0x1a60320a,
    0xd6a100c6,
    0x402c7279,
    0x679f25fe,
    0xfb1fa3cc,
    0x8ea5e9f8,
    0xdb3222f8,
    0x3c7516df,
    0xfd616b15,
    0x2f501ec8,
    0xad0552ab,
    0x323db5fa,
    0xfd238760,
    0x53317b48,
    0x3e00df82,
    0x9e5c57bb,
    0xca6f8ca0,
    0x1a87562e,
    0xdf1769db,
    0xd542a8f6,
    0x287effc3,
    0xac6732c6,
    0x8c4f5573,
    0x695b27b0,
    0xbbca58c8,
    0xe1ffa35d,
    0xb8f011a0,
    0x10fa3d98,
    0xfd2183b8,
    0x4afcb56c,
    0x2dd1d35b,
    0x9a53e479,
    0xb6f84565,
    0xd28e49bc,
    0x4bfb9790,
    0xe1ddf2da,
    0xa4cb7e33,
    0x62fb1341,
    0xcee4c6e8,
    0xef20cada,
    0x36774c01,
    0xd07e9efe,
    0x2bf11fb4,
    0x95dbda4d,
    0xae909198,
    0xeaad8e71,
    0x6b93d5a0,
    0xd08ed1d0,
    0xafc725e0,
    0x8e3c5b2f,
    0x8e7594b7,
    0x8ff6e2fb,
    0xf2122b64,
    0x8888b812,
    0x900df01c,
    0x4fad5ea0,
    0x688fc31c,
    0xd1cff191,
    0xb3a8c1ad,
    0x2f2f2218,
    0xbe0e1777,
    0xea752dfe,
    0x8b021fa1,
    0xe5a0cc0f,
    0xb56f74e8,
    0x18acf3d6,
    0xce89e299,
    0xb4a84fe0,
    0xfd13e0b7,
    0x7cc43b81,
    0xd2ada8d9,
    0x165fa266,
    0x80957705,
    0x93cc7314,
    0x211a1477,
    0xe6ad2065,
    0x77b5fa86,
    0xc75442f5,
    0xfb9d35cf,
    0xebcdaf0c,
    0x7b3e89a0,
    0xd6411bd3,
    0xae1e7e49,
    0x00250e2d,
    0x2071b35e,
    0x226800bb,
    0x57b8e0af,
    0x2464369b,
    0xf009b91e,
    0x5563911d,
    0x59dfa6aa,
    0x78c14389,
    0xd95a537f,
    0x207d5ba2,
    0x02e5b9c5,
    0x83260376,
    0x6295cfa9,
    0x11c81968,
    0x4e734a41,
    0xb3472dca,
    0x7b14a94a,
    0x1b510052,
    0x9a532915,
    0xd60f573f,
    0xbc9bc6e4,
    0x2b60a476,
    0x81e67400,
    0x08ba6fb5,
    0x571be91f,
    0xf296ec6b,
    0x2a0dd915,
    0xb6636521,
    0xe7b9f9b6,
    0xff34052e,
    0xc5855664,
    0x53b02d5d,
    0xa99f8fa1,
    0x08ba4799,
    0x6e85076a,
    0x4b7a70e9,
    0xb5b32944,
    0xdb75092e,
    0xc4192623,
    0xad6ea6b0,
    0x49a7df7d,
    0x9cee60b8,
    0x8fedb266,
    0xecaa8c71,
    0x699a17ff,
    0x5664526c,
    0xc2b19ee1,
    0x193602a5,
    0x75094c29,
    0xa0591340,
    0xe4183a3e,
    0x3f54989a,
    0x5b429d65,
    0x6b8fe4d6,
    0x99f73fd6,
    0xa1d29c07,
    0xefe830f5,
    0x4d2d38e6,
    0xf0255dc1,
    0x4cdd2086,
    0x8470eb26,
    0x6382e9c6,
    0x021ecc5e,
    0x09686b3f,
    0x3ebaefc9,
    0x3c971814,
    0x6b6a70a1,
    0x687f3584,
    0x52a0e286,
    0xb79c5305,
    0xaa500737,
    0x3e07841c,
    0x7fdeae5c,
    0x8e7d44ec,
    0x5716f2b8,
    0xb03ada37,
    0xf0500c0d,
    0xf01c1f04,
    0x0200b3ff,
    0xae0cf51a,
    0x3cb574b2,
    0x25837a58,
    0xdc0921bd,
    0xd19113f9,
    0x7ca92ff6,
    0x94324773,
    0x22f54701,
    0x3ae5e581,
    0x37c2dadc,
    0xc8b57634,
    0x9af3dda7,
    0xa9446146,
    0x0fd0030e,
    0xecc8c73e,
    0xa4751e41,
    0xe238cd99,
    0x3bea0e2f,
    0x3280bba1,
    0x183eb331,
    0x4e548b38,
    0x4f6db908,
    0x6f420d03,
    0xf60a04bf,
    0x2cb81290,
    0x24977c79,
    0x5679b072,
    0xbcaf89af,
    0xde9a771f,
    0xd9930810,
    0xb38bae12,
    0xdccf3f2e,
    0x5512721f,
    0x2e6b7124,
    0x501adde6,
    0x9f84cd87,
    0x7a584718,
    0x7408da17,
    0xbc9f9abc,
    0xe94b7d8c,
    0xec7aec3a,
    0xdb851dfa,
    0x63094366,
    0xc464c3d2,
    0xef1c1847,
    0x3215d908,
    0xdd433b37,
    0x24c2ba16,
    0x12a14d43,
    0x2a65c451,
    0x50940002,
    0x133ae4dd,
    0x71dff89e,
    0x10314e55,
    0x81ac77d6,
    0x5f11199b,
    0x043556f1,
    0xd7a3c76b,
    0x3c11183b,
    0x5924a509,
    0xf28fe6ed,
    0x97f1fbfa,
    0x9ebabf2c,
    0x1e153c6e,
    0x86e34570,
    0xeae96fb1,
    0x860e5e0a,
    0x5a3e2ab3,
    0x771fe71c,
    0x4e3d06fa,
    0x2965dcb9,
    0x99e71d0f,
    0x803e89d6,
    0x5266c825,
    0x2e4cc978,
    0x9c10b36a,
    0xc6150eba,
    0x94e2ea78,
    0xa5fc3c53,
    0x1e0a2df4,
    0xf2f74ea7,
    0x361d2b3d,
    0x1939260f,
    0x19c27960,
    0x5223a708,
    0xf71312b6,
    0xebadfe6e,
    0xeac31f66,
    0xe3bc4595,
    0xa67bc883,
    0xb17f37d1,
    0x018cff28,
    0xc332ddef,
    0xbe6c5aa5,
    0x65582185,
    0x68ab9802,
    0xeecea50f,
    0xdb2f953b,
    0x2aef7dad,
    0x5b6e2f84,
    0x1521b628,
    0x29076170,
    0xecdd4775,
    0x619f1510,
    0x13cca830,
    0xeb61bd96,
    0x0334fe1e,
    0xaa0363cf,
    0xb5735c90,
    0x4c70a239,
    0xd59e9e0b,
    0xcbaade14,
    0xeecc86bc,
    0x60622ca7,
    0x9cab5cab,
    0xb2f3846e,
    0x648b1eaf,
    0x19bdf0ca,
    0xa02369b9,
    0x655abb50,
    0x40685a32,
    0x3c2ab4b3,
    0x319ee9d5,
    0xc021b8f7,
    0x9b540b19,
    0x875fa099,
    0x95f7997e,
    0x623d7da8,
    0xf837889a,
    0x97e32d77,
    0x11ed935f,
    0x16681281,
    0x0e358829,
    0xc7e61fd6,
    0x96dedfa1,
    0x7858ba99,
    0x57f584a5,
    0x1b227263,
    0x9b83c3ff,
    0x1ac24696,
    0xcdb30aeb,
    0x532e3054,
    0x8fd948e4,
    0x6dbc3128,
    0x58ebf2ef,
    0x34c6ffea,
    0xfe28ed61,
    0xee7c3c73,
    0x5d4a14d9,
    0xe864b7e3,
    0x42105d14,
    0x203e13e0,
    0x45eee2b6,
    0xa3aaabea,
    0xdb6c4f15,
    0xfacb4fd0,
    0xc742f442,
    0xef6abbb5,
    0x654f3b1d,
    0x41cd2105,
    0xd81e799e,
    0x86854dc7,
    0xe44b476a,
    0x3d816250,
    0xcf62a1f2,
    0x5b8d2646,
    0xfc8883a0,
    0xc1c7b6a3,
    0x7f1524c3,
    0x69cb7492,
    0x47848a0b,
    0x5692b285,
    0x095bbf00,
    0xad19489d,
    0x1462b174,
    0x23820e00,
    0x58428d2a,
    0x0c55f5ea,
    0x1dadf43e,
    0x233f7061,
    0x3372f092,
    0x8d937e41,
    0xd65fecf1,
    0x6c223bdb,
    0x7cde3759,
    0xcbee7460,
    0x4085f2a7,
    0xce77326e,
    0xa6078084,
    0x19f8509e,
    0xe8efd855,
    0x61d99735,
    0xa969a7aa,
    0xc50c06c2,
    0x5a04abfc,
    0x800bcadc,
    0x9e447a2e,
    0xc3453484,
    0xfdd56705,
    0x0e1e9ec9,
    0xdb73dbd3,
    0x105588cd,
    0x675fda79,
    0xe3674340,
    0xc5c43465,
    0x713e38d8,
    0x3d28f89e,
    0xf16dff20,
    0x153e21e7,
    0x8fb03d4a,
    0xe6e39f2b,
    0xdb83adf7,
    0xe93d5a68,
    0x948140f7,
    0xf64c261c,
    0x94692934,
    0x411520f7,
    0x7602d4f7,
    0xbcf46b2e,
    0xd4a20068,
    0xd4082471,
    0x3320f46a,
    0x43b7d4b7,
    0x500061af,
    0x1e39f62e,
    0x97244546,
    0x14214f74,
    0xbf8b8840,
    0x4d95fc1d,
    0x96b591af,
    0x70f4ddd3,
    0x66a02f45,
    0xbfbc09ec,
    0x03bd9785,
    0x7fac6dd0,
    0x31cb8504,
    0x96eb27b3,
    0x55fd3941,
    0xda2547e6,
    0xabca0a9a,
    0x28507825,
    0x530429f4,
    0x0a2c86da,
    0xe9b66dfb,
    0x68dc1462,
    0xd7486900,
    0x680ec0a4,
    0x27a18dee,
    0x4f3ffea2,
    0xe887ad8c,
    0xb58ce006,
    0x7af4d6b6,
    0xaace1e7c,
    0xd3375fec,
    0xce78a399,
    0x406b2a42,
    0x20fe9e35,
    0xd9f385b9,
    0xee39d7ab,
    0x3b124e8b,
    0x1dc9faf7,
    0x4b6d1856,
    0x26a36631,
    0xeae397b2,
    0x3a6efa74,
    0xdd5b4332,
    0x6841e7f7,
    0xca7820fb,
    0xfb0af54e,
    0xd8feb397,
    0x454056ac,
    0xba489527,
    0x55533a3a,
    0x20838d87,
    0xfe6ba9b7,
    0xd096954b,
    0x55a867bc,
    0xa1159a58,
    0xcca92963,
    0x99e1db33,
    0xa62a4a56,
    0x3f3125f9,
    0x5ef47e1c,
    0x9029317c,
    0xfdf8e802,
    0x04272f70,
    0x80bb155c,
    0x05282ce3,
    0x95c11548,
    0xe4c66d22,
    0x48c1133f,
    0xc70f86dc,
    0x07f9c9ee,
    0x41041f0f,
    0x404779a4,
    0x5d886e17,
    0x325f51eb,
    0xd59bc0d1,
    0xf2bcc18f,
    0x41113564,
    0x257b7834,
    0x602a9c60,
    0xdff8e8a3,
    0x1f636c1b,
    0x0e12b4c2,
    0x02e1329e,
    0xaf664fd1,
    0xcad18115,
    0x6b2395e0,
    0x333e92e1,
    0x3b240b62,
    0xeebeb922,
    0x85b2a20e,
    0xe6ba0d99,
    0xde720c8c,
    0x2da2f728,
    0xd0127845,
    0x95b794fd,
    0x647d0862,
    0xe7ccf5f0,
    0x5449a36f,
    0x877d48fa,
    0xc39dfd27,
    0xf33e8d1e,
    0x0a476341,
    0x992eff74,
    0x3a6f6eab,
    0xf4f8fd37,
    0xa812dc60,
    0xa1ebddf8,
    0x991be14c,
    0xdb6e6b0d,
    0xc67b5510,
    0x6d672c37,
    0x2765d43b,
    0xdcd0e804,
    0xf1290dc7,
    0xcc00ffa3,
    0xb5390f92,
    0x690fed0b,
    0x667b9ffb,
    0xcedb7d9c,
    0xa091cf0b,
    0xd9155ea3,
    0xbb132f88,
    0x515bad24,
    0x7b9479bf,
    0x763bd6eb,
    0x37392eb3,
    0xcc115979,
    0x8026e297,
    0xf42e312d,
    0x6842ada7,
    0xc66a2b3b,
    0x12754ccc,
    0x782ef11c,
    0x6a124237,
    0xb79251e7,
    0x06a1bbe6,
    0x4bfb6350,
    0x1a6b1018,
    0x11caedfa,
    0x3d25bdd8,
    0xe2e1c3c9,
    0x44421659,
    0x0a121386,
    0xd90cec6e,
    0xd5abea2a,
    0x64af674e,
    0xda86a85f,
    0xbebfe988,
    0x64e4c3fe,
    0x9dbc8057,
    0xf0f7c086,
    0x60787bf8,
    0x6003604d,
    0xd1fd8346,
    0xf6381fb0,
    0x7745ae04,
    0xd736fccc,
    0x83426b33,
    0xf01eab71,
    0xb0804187,
    0x3c005e5f,
    0x77a057be,
    0xbde8ae24,
    0x55464299,
    0xbf582e61,
    0x4e58f48f,
    0xf2ddfda2,
    0xf474ef38,
    0x8789bdc2,
    0x5366f9c3,
    0xc8b38e74,
    0xb475f255,
    0x46fcd9b9,
    0x7aeb2661,
    0x8b1ddf84,
    0x846a0e79,
    0x915f95e2,
    0x466e598e,
    0x20b45770,
    0x8cd55591,
    0xc902de4c,
    0xb90bace1,
    0xbb8205d0,
    0x11a86248,
    0x7574a99e,
    0xb77f19b6,
    0xe0a9dc09,
    0x662d09a1,
    0xc4324633,
    0xe85a1f02,
    0x09f0be8c,
    0x4a99a025,
    0x1d6efe10,
    0x1ab93d1d,
    0x0ba5a4df,
    0xa186f20f,
    0x2868f169,
    0xdcb7da83,
    0x573906fe,
    0xa1e2ce9b,
    0x4fcd7f52,
    0x50115e01,
    0xa70683fa,
    0xa002b5c4,
    0x0de6d027,
    0x9af88c27,
    0x773f8641,
    0xc3604c06,
    0x61a806b5,
    0xf0177a28,
    0xc0f586e0,
    0x006058aa,
    0x30dc7d62,
    0x11e69ed7,
    0x2338ea63,
    0x53c2dd94,
    0xc2c21634,
    0xbbcbee56,
    0x90bcb6de,
    0xebfc7da1,
    0xce591d76,
    0x6f05e409,
    0x4b7c0188,
    0x39720a3d,
    0x7c927c24,
    0x86e3725f,
    0x724d9db9,
    0x1ac15bb4,
    0xd39eb8fc,
    0xed545578,
    0x08fca5b5,
    0xd83d7cd3,
    0x4dad0fc4,
    0x1e50ef5e,
    0xb161e6f8,
    0xa28514d9,
    0x6c51133c,
    0x6fd5c7e7,
    0x56e14ec4,
    0x362abfce,
    0xddc6c837,
    0xd79a3234,
    0x92638212,
    0x670efa8e,
    0x406000e0,
    0x3a39ce37,
    0xd3faf5cf,
    0xabc27737,
    0x5ac52d1b,
    0x5cb0679e,
    0x4fa33742,
    0xd3822740,
    0x99bc9bbe,
    0xd5118e9d,
    0xbf0f7315,
    0xd62d1c7e,
    0xc700c47b,
    0xb78c1b6b,
    0x21a19045,
    0xb26eb1be,
    0x6a366eb4,
    0x5748ab2f,
    0xbc946e79,
    0xc6a376d2,
    0x6549c2c8,
    0x530ff8ee,
    0x468dde7d,
    0xd5730a1d,
    0x4cd04dc6,
    0x2939bbdb,
    0xa9ba4650,
    0xac9526e8,
    0xbe5ee304,
    0xa1fad5f0,
    0x6a2d519a,
    0x63ef8ce2,
    0x9a86ee22,
    0xc089c2b8,
    0x43242ef6,
    0xa51e03aa,
    0x9cf2d0a4,
    0x83c061ba,
    0x9be96a4d,
    0x8fe51550,
    0xba645bd6,
    0x2826a2f9,
    0xa73a3ae1,
    0x4ba99586,
    0xef5562e9,
    0xc72fefd3,
    0xf752f7da,
    0x3f046f69,
    0x77fa0a59,
    0x80e4a915,
    0x87b08601,
    0x9b09e6ad,
    0x3b3ee593,
    0xe990fd5a,
    0x9e34d797,
    0x2cf0b7d9,
    0x022b8b51,
    0x96d5ac3a,
    0x017da67d,
    0xd1cf3ed6,
    0x7c7d2d28,
    0x1f9f25cf,
    0xadf2b89b,
    0x5ad6b472,
    0x5a88f54c,
    0xe029ac71,
    0xe019a5e6,
    0x47b0acfd,
    0xed93fa9b,
    0xe8d3c48d,
    0x283b57cc,
    0xf8d56629,
    0x79132e28,
    0x785f0191,
    0xed756055,
    0xf7960e44,
    0xe3d35e8c,
    0x15056dd4,
    0x88f46dba,
    0x03a16125,
    0x0564f0bd,
    0xc3eb9e15,
    0x3c9057a2,
    0x97271aec,
    0xa93a072a,
    0x1b3f6d9b,
    0x1e6321f5,
    0xf59c66fb,
    0x26dcf319,
    0x7533d928,
    0xb155fdf5,
    0x03563482,
    0x8aba3cbb,
    0x28517711,
    0xc20ad9f8,
    0xabcc5167,
    0xccad925f,
    0x4de81751,
    0x3830dc8e,
    0x379d5862,
    0x9320f991,
    0xea7a90c2,
    0xfb3e7bce,
    0x5121ce64,
    0x774fbe32,
    0xa8b6e37e,
    0xc3293d46,
    0x48de5369,
    0x6413e680,
    0xa2ae0810,
    0xdd6db224,
    0x69852dfd,
    0x09072166,
    0xb39a460a,
    0x6445c0dd,
    0x586cdecf,
    0x1c20c8ae,
    0x5bbef7dd,
    0x1b588d40,
    0xccd2017f,
    0x6bb4e3bb,
    0xdda26a7e,
    0x3a59ff45,
    0x3e350a44,
    0xbcb4cdd5,
    0x72eacea8,
    0xfa6484bb,
    0x8d6612ae,
    0xbf3c6f47,
    0xd29be463,
    0x542f5d9e,
    0xaec2771b,
    0xf64e6370,
    0x740e0d8d,
    0xe75b1357,
    0xf8721671,
    0xaf537d5d,
    0x4040cb08,
    0x4eb4e2cc,
    0x34d2466a,
    0x0115af84,
    0xe1b00428,
    0x95983a1d,
    0x06b89fb4,
    0xce6ea048,
    0x6f3f3b82,
    0x3520ab82,
    0x011a1d4b,
    0x277227f8,
    0x611560b1,
    0xe7933fdc,
    0xbb3a792b,
    0x344525bd,
    0xa08839e1,
    0x51ce794b,
    0x2f32c9b7,
    0xa01fbac9,
    0xe01cc87e,
    0xbcc7d1f6,
    0xcf0111c3,
    0xa1e8aac7,
    0x1a908749,
    0xd44fbd9a,
    0xd0dadecb,
    0xd50ada38,
    0x0339c32a,
    0xc6913667,
    0x8df9317c,
    0xe0b12b4f,
    0xf79e59b7,
    0x43f5bb3a,
    0xf2d519ff,
    0x27d9459c,
    0xbf97222c,
    0x15e6fc2a,
    0x0f91fc71,
    0x9b941525,
    0xfae59361,
    0xceb69ceb,
    0xc2a86459,
    0x12baa8d1,
    0xb6c1075e,
    0xe3056a0c,
    0x10d25065,
    0xcb03a442,
    0xe0ec6e0e,
    0x1698db3b,
    0x4c98a0be,
    0x3278e964,
    0x9f1f9532,
    0xe0d392df,
    0xd3a0342b,
    0x8971f21e,
    0x1b0a7441,
    0x4ba3348c,
    0xc5be7120,
    0xc37632d8,
    0xdf359f8d,
    0x9b992f2e,
    0xe60b6f47,
    0x0fe3f11d,
    0xe54cda54,
    0x1edad891,
    0xce6279cf,
    0xcd3e7e6f,
    0x1618b166,
    0xfd2c1d05,
    0x848fd2c5,
    0xf6fb2299,
    0xf523f357,
    0xa6327623,
    0x93a83531,
    0x56cccd02,
    0xacf08162,
    0x5a75ebb5,
    0x6e163697,
    0x88d273cc,
    0xde966292,
    0x81b949d0,
    0x4c50901b,
    0x71c65614,
    0xe6c6c7bd,
    0x327a140a,
    0x45e1d006,
    0xc3f27b9a,
    0xc9aa53fd,
    0x62a80f00,
    0xbb25bfe2,
    0x35bdd2f6,
    0x71126905,
    0xb2040222,
    0xb6cbcf7c,
    0xcd769c2b,
    0x53113ec0,
    0x1640e3d3,
    0x38abbd60,
    0x2547adf0,
    0xba38209c,
    0xf746ce76,
    0x77afa1c5,
    0x20756060,
    0x85cbfe4e,
    0x8ae88dd8,
    0x7aaaf9b0,
    0x4cf9aa7e,
    0x1948c25c,
    0x02fb8a8c,
    0x01c36ae4,
    0xd6ebe1f9,
    0x90d4f869,
    0xa65cdea0,
    0x3f09252d,
    0xc208e69f,
    0xb74e6132,
    0xce77e25b,
    0x578fdfe3,
    0x3ac372e6
];
/**
 * @type {Array.<number>}
 * @const
 * @inner
 */ var C_ORIG = [
    0x4f727068,
    0x65616e42,
    0x65686f6c,
    0x64657253,
    0x63727944,
    0x6f756274
];
/**
 * @param {Array.<number>} lr
 * @param {number} off
 * @param {Array.<number>} P
 * @param {Array.<number>} S
 * @returns {Array.<number>}
 * @inner
 */ function _encipher(lr, off, P, S) {
    // This is our bottleneck: 1714/1905 ticks / 90% - see profile.txt
    var n, l = lr[off], r = lr[off + 1];
    l ^= P[0];
    /*
    for (var i=0, k=BLOWFISH_NUM_ROUNDS-2; i<=k;)
        // Feistel substitution on left word
        n  = S[l >>> 24],
        n += S[0x100 | ((l >> 16) & 0xff)],
        n ^= S[0x200 | ((l >> 8) & 0xff)],
        n += S[0x300 | (l & 0xff)],
        r ^= n ^ P[++i],
        // Feistel substitution on right word
        n  = S[r >>> 24],
        n += S[0x100 | ((r >> 16) & 0xff)],
        n ^= S[0x200 | ((r >> 8) & 0xff)],
        n += S[0x300 | (r & 0xff)],
        l ^= n ^ P[++i];
    */ //The following is an unrolled version of the above loop.
    //Iteration 0
    n = S[l >>> 24];
    n += S[0x100 | l >> 16 & 0xff];
    n ^= S[0x200 | l >> 8 & 0xff];
    n += S[0x300 | l & 0xff];
    r ^= n ^ P[1];
    n = S[r >>> 24];
    n += S[0x100 | r >> 16 & 0xff];
    n ^= S[0x200 | r >> 8 & 0xff];
    n += S[0x300 | r & 0xff];
    l ^= n ^ P[2];
    //Iteration 1
    n = S[l >>> 24];
    n += S[0x100 | l >> 16 & 0xff];
    n ^= S[0x200 | l >> 8 & 0xff];
    n += S[0x300 | l & 0xff];
    r ^= n ^ P[3];
    n = S[r >>> 24];
    n += S[0x100 | r >> 16 & 0xff];
    n ^= S[0x200 | r >> 8 & 0xff];
    n += S[0x300 | r & 0xff];
    l ^= n ^ P[4];
    //Iteration 2
    n = S[l >>> 24];
    n += S[0x100 | l >> 16 & 0xff];
    n ^= S[0x200 | l >> 8 & 0xff];
    n += S[0x300 | l & 0xff];
    r ^= n ^ P[5];
    n = S[r >>> 24];
    n += S[0x100 | r >> 16 & 0xff];
    n ^= S[0x200 | r >> 8 & 0xff];
    n += S[0x300 | r & 0xff];
    l ^= n ^ P[6];
    //Iteration 3
    n = S[l >>> 24];
    n += S[0x100 | l >> 16 & 0xff];
    n ^= S[0x200 | l >> 8 & 0xff];
    n += S[0x300 | l & 0xff];
    r ^= n ^ P[7];
    n = S[r >>> 24];
    n += S[0x100 | r >> 16 & 0xff];
    n ^= S[0x200 | r >> 8 & 0xff];
    n += S[0x300 | r & 0xff];
    l ^= n ^ P[8];
    //Iteration 4
    n = S[l >>> 24];
    n += S[0x100 | l >> 16 & 0xff];
    n ^= S[0x200 | l >> 8 & 0xff];
    n += S[0x300 | l & 0xff];
    r ^= n ^ P[9];
    n = S[r >>> 24];
    n += S[0x100 | r >> 16 & 0xff];
    n ^= S[0x200 | r >> 8 & 0xff];
    n += S[0x300 | r & 0xff];
    l ^= n ^ P[10];
    //Iteration 5
    n = S[l >>> 24];
    n += S[0x100 | l >> 16 & 0xff];
    n ^= S[0x200 | l >> 8 & 0xff];
    n += S[0x300 | l & 0xff];
    r ^= n ^ P[11];
    n = S[r >>> 24];
    n += S[0x100 | r >> 16 & 0xff];
    n ^= S[0x200 | r >> 8 & 0xff];
    n += S[0x300 | r & 0xff];
    l ^= n ^ P[12];
    //Iteration 6
    n = S[l >>> 24];
    n += S[0x100 | l >> 16 & 0xff];
    n ^= S[0x200 | l >> 8 & 0xff];
    n += S[0x300 | l & 0xff];
    r ^= n ^ P[13];
    n = S[r >>> 24];
    n += S[0x100 | r >> 16 & 0xff];
    n ^= S[0x200 | r >> 8 & 0xff];
    n += S[0x300 | r & 0xff];
    l ^= n ^ P[14];
    //Iteration 7
    n = S[l >>> 24];
    n += S[0x100 | l >> 16 & 0xff];
    n ^= S[0x200 | l >> 8 & 0xff];
    n += S[0x300 | l & 0xff];
    r ^= n ^ P[15];
    n = S[r >>> 24];
    n += S[0x100 | r >> 16 & 0xff];
    n ^= S[0x200 | r >> 8 & 0xff];
    n += S[0x300 | r & 0xff];
    l ^= n ^ P[16];
    lr[off] = r ^ P[BLOWFISH_NUM_ROUNDS + 1];
    lr[off + 1] = l;
    return lr;
}
/**
 * @param {Array.<number>} data
 * @param {number} offp
 * @returns {{key: number, offp: number}}
 * @inner
 */ function _streamtoword(data, offp) {
    for(var i = 0, word = 0; i < 4; ++i)word = word << 8 | data[offp] & 0xff, offp = (offp + 1) % data.length;
    return {
        key: word,
        offp: offp
    };
}
/**
 * @param {Array.<number>} key
 * @param {Array.<number>} P
 * @param {Array.<number>} S
 * @inner
 */ function _key(key, P, S) {
    var offset = 0, lr = [
        0,
        0
    ], plen = P.length, slen = S.length, sw;
    for(var i = 0; i < plen; i++)sw = _streamtoword(key, offset), offset = sw.offp, P[i] = P[i] ^ sw.key;
    for(i = 0; i < plen; i += 2)lr = _encipher(lr, 0, P, S), P[i] = lr[0], P[i + 1] = lr[1];
    for(i = 0; i < slen; i += 2)lr = _encipher(lr, 0, P, S), S[i] = lr[0], S[i + 1] = lr[1];
}
/**
 * Expensive key schedule Blowfish.
 * @param {Array.<number>} data
 * @param {Array.<number>} key
 * @param {Array.<number>} P
 * @param {Array.<number>} S
 * @inner
 */ function _ekskey(data, key, P, S) {
    var offp = 0, lr = [
        0,
        0
    ], plen = P.length, slen = S.length, sw;
    for(var i = 0; i < plen; i++)sw = _streamtoword(key, offp), offp = sw.offp, P[i] = P[i] ^ sw.key;
    offp = 0;
    for(i = 0; i < plen; i += 2)sw = _streamtoword(data, offp), offp = sw.offp, lr[0] ^= sw.key, sw = _streamtoword(data, offp), offp = sw.offp, lr[1] ^= sw.key, lr = _encipher(lr, 0, P, S), P[i] = lr[0], P[i + 1] = lr[1];
    for(i = 0; i < slen; i += 2)sw = _streamtoword(data, offp), offp = sw.offp, lr[0] ^= sw.key, sw = _streamtoword(data, offp), offp = sw.offp, lr[1] ^= sw.key, lr = _encipher(lr, 0, P, S), S[i] = lr[0], S[i + 1] = lr[1];
}
/**
 * Internaly crypts a string.
 * @param {Array.<number>} b Bytes to crypt
 * @param {Array.<number>} salt Salt bytes to use
 * @param {number} rounds Number of rounds
 * @param {function(Error, Array.<number>=)=} callback Callback receiving the error, if any, and the resulting bytes. If
 *  omitted, the operation will be performed synchronously.
 *  @param {function(number)=} progressCallback Callback called with the current progress
 * @returns {!Array.<number>|undefined} Resulting bytes if callback has been omitted, otherwise `undefined`
 * @inner
 */ function _crypt(b, salt, rounds, callback, progressCallback) {
    var cdata = C_ORIG.slice(), clen = cdata.length, err;
    // Validate
    if (rounds < 4 || rounds > 31) {
        err = Error("Illegal number of rounds (4-31): " + rounds);
        if (callback) {
            nextTick(callback.bind(this, err));
            return;
        } else throw err;
    }
    if (salt.length !== BCRYPT_SALT_LEN) {
        err = Error("Illegal salt length: " + salt.length + " != " + BCRYPT_SALT_LEN);
        if (callback) {
            nextTick(callback.bind(this, err));
            return;
        } else throw err;
    }
    rounds = 1 << rounds >>> 0;
    var P, S, i = 0, j;
    //Use typed arrays when available - huge speedup!
    if (typeof Int32Array === "function") {
        P = new Int32Array(P_ORIG);
        S = new Int32Array(S_ORIG);
    } else {
        P = P_ORIG.slice();
        S = S_ORIG.slice();
    }
    _ekskey(salt, b, P, S);
    /**
   * Calcualtes the next round.
   * @returns {Array.<number>|undefined} Resulting array if callback has been omitted, otherwise `undefined`
   * @inner
   */ function next() {
        if (progressCallback) progressCallback(i / rounds);
        if (i < rounds) {
            var start = Date.now();
            for(; i < rounds;){
                i = i + 1;
                _key(b, P, S);
                _key(salt, P, S);
                if (Date.now() - start > MAX_EXECUTION_TIME) break;
            }
        } else {
            for(i = 0; i < 64; i++)for(j = 0; j < clen >> 1; j++)_encipher(cdata, j << 1, P, S);
            var ret = [];
            for(i = 0; i < clen; i++)ret.push((cdata[i] >> 24 & 0xff) >>> 0), ret.push((cdata[i] >> 16 & 0xff) >>> 0), ret.push((cdata[i] >> 8 & 0xff) >>> 0), ret.push((cdata[i] & 0xff) >>> 0);
            if (callback) {
                callback(null, ret);
                return;
            } else return ret;
        }
        if (callback) nextTick(next);
    }
    // Async
    if (typeof callback !== "undefined") {
        next();
    // Sync
    } else {
        var res;
        while(true)if (typeof (res = next()) !== "undefined") return res || [];
    }
}
/**
 * Internally hashes a password.
 * @param {string} password Password to hash
 * @param {?string} salt Salt to use, actually never null
 * @param {function(Error, string=)=} callback Callback receiving the error, if any, and the resulting hash. If omitted,
 *  hashing is performed synchronously.
 *  @param {function(number)=} progressCallback Callback called with the current progress
 * @returns {string|undefined} Resulting hash if callback has been omitted, otherwise `undefined`
 * @inner
 */ function _hash(password, salt, callback, progressCallback) {
    var err;
    if (typeof password !== "string" || typeof salt !== "string") {
        err = Error("Invalid string / salt: Not a string");
        if (callback) {
            nextTick(callback.bind(this, err));
            return;
        } else throw err;
    }
    // Validate the salt
    var minor, offset;
    if (salt.charAt(0) !== "$" || salt.charAt(1) !== "2") {
        err = Error("Invalid salt version: " + salt.substring(0, 2));
        if (callback) {
            nextTick(callback.bind(this, err));
            return;
        } else throw err;
    }
    if (salt.charAt(2) === "$") minor = String.fromCharCode(0), offset = 3;
    else {
        minor = salt.charAt(2);
        if (minor !== "a" && minor !== "b" && minor !== "y" || salt.charAt(3) !== "$") {
            err = Error("Invalid salt revision: " + salt.substring(2, 4));
            if (callback) {
                nextTick(callback.bind(this, err));
                return;
            } else throw err;
        }
        offset = 4;
    }
    // Extract number of rounds
    if (salt.charAt(offset + 2) > "$") {
        err = Error("Missing salt rounds");
        if (callback) {
            nextTick(callback.bind(this, err));
            return;
        } else throw err;
    }
    var r1 = parseInt(salt.substring(offset, offset + 1), 10) * 10, r2 = parseInt(salt.substring(offset + 1, offset + 2), 10), rounds = r1 + r2, real_salt = salt.substring(offset + 3, offset + 25);
    password += minor >= "a" ? "\x00" : "";
    var passwordb = utf8Array(password), saltb = base64_decode(real_salt, BCRYPT_SALT_LEN);
    /**
   * Finishes hashing.
   * @param {Array.<number>} bytes Byte array
   * @returns {string}
   * @inner
   */ function finish(bytes) {
        var res = [];
        res.push("$2");
        if (minor >= "a") res.push(minor);
        res.push("$");
        if (rounds < 10) res.push("0");
        res.push(rounds.toString());
        res.push("$");
        res.push(base64_encode(saltb, saltb.length));
        res.push(base64_encode(bytes, C_ORIG.length * 4 - 1));
        return res.join("");
    }
    // Sync
    if (typeof callback == "undefined") return finish(_crypt(passwordb, saltb, rounds));
    else {
        _crypt(passwordb, saltb, rounds, function(err, bytes) {
            if (err) callback(err, null);
            else callback(null, finish(bytes));
        }, progressCallback);
    }
}
function encodeBase64(bytes, length) {
    return base64_encode(bytes, length);
}
function decodeBase64(string, length) {
    return base64_decode(string, length);
}
const __TURBOPACK__default__export__ = {
    setRandomFallback,
    genSaltSync,
    genSalt,
    hashSync,
    hash,
    compareSync,
    compare,
    getRounds,
    getSalt,
    truncates,
    encodeBase64,
    decodeBase64
};
}),
"[project]/Documents/GitHub/buenasv2/node_modules/safe-buffer/index.js [app-route] (ecmascript)", ((__turbopack_context__, module, exports) => {

/*! safe-buffer. MIT License. Feross Aboukhadijeh <https://feross.org/opensource> */ /* eslint-disable node/no-deprecated-api */ var buffer = __turbopack_context__.r("[externals]/buffer [external] (buffer, cjs)");
var Buffer = buffer.Buffer;
// alternative to using Object.keys for old browsers
function copyProps(src, dst) {
    for(var key in src){
        dst[key] = src[key];
    }
}
if (Buffer.from && Buffer.alloc && Buffer.allocUnsafe && Buffer.allocUnsafeSlow) {
    module.exports = buffer;
} else {
    // Copy properties from require('buffer')
    copyProps(buffer, exports);
    exports.Buffer = SafeBuffer;
}
function SafeBuffer(arg, encodingOrOffset, length) {
    return Buffer(arg, encodingOrOffset, length);
}
SafeBuffer.prototype = Object.create(Buffer.prototype);
// Copy static methods from Buffer
copyProps(Buffer, SafeBuffer);
SafeBuffer.from = function(arg, encodingOrOffset, length) {
    if (typeof arg === 'number') {
        throw new TypeError('Argument must not be a number');
    }
    return Buffer(arg, encodingOrOffset, length);
};
SafeBuffer.alloc = function(size, fill, encoding) {
    if (typeof size !== 'number') {
        throw new TypeError('Argument must be a number');
    }
    var buf = Buffer(size);
    if (fill !== undefined) {
        if (typeof encoding === 'string') {
            buf.fill(fill, encoding);
        } else {
            buf.fill(fill);
        }
    } else {
        buf.fill(0);
    }
    return buf;
};
SafeBuffer.allocUnsafe = function(size) {
    if (typeof size !== 'number') {
        throw new TypeError('Argument must be a number');
    }
    return Buffer(size);
};
SafeBuffer.allocUnsafeSlow = function(size) {
    if (typeof size !== 'number') {
        throw new TypeError('Argument must be a number');
    }
    return buffer.SlowBuffer(size);
};
}),
"[project]/Documents/GitHub/buenasv2/node_modules/jws/lib/data-stream.js [app-route] (ecmascript)", ((__turbopack_context__, module, exports) => {

/*global module, process*/ var Buffer = __turbopack_context__.r("[project]/Documents/GitHub/buenasv2/node_modules/safe-buffer/index.js [app-route] (ecmascript)").Buffer;
var Stream = __turbopack_context__.r("[externals]/stream [external] (stream, cjs)");
var util = __turbopack_context__.r("[externals]/util [external] (util, cjs)");
function DataStream(data) {
    this.buffer = null;
    this.writable = true;
    this.readable = true;
    // No input
    if (!data) {
        this.buffer = Buffer.alloc(0);
        return this;
    }
    // Stream
    if (typeof data.pipe === 'function') {
        this.buffer = Buffer.alloc(0);
        data.pipe(this);
        return this;
    }
    // Buffer or String
    // or Object (assumedly a passworded key)
    if (data.length || typeof data === 'object') {
        this.buffer = data;
        this.writable = false;
        process.nextTick((function() {
            this.emit('end', data);
            this.readable = false;
            this.emit('close');
        }).bind(this));
        return this;
    }
    throw new TypeError('Unexpected data type (' + typeof data + ')');
}
util.inherits(DataStream, Stream);
DataStream.prototype.write = function write(data) {
    this.buffer = Buffer.concat([
        this.buffer,
        Buffer.from(data)
    ]);
    this.emit('data', data);
};
DataStream.prototype.end = function end(data) {
    if (data) this.write(data);
    this.emit('end', data);
    this.emit('close');
    this.writable = false;
    this.readable = false;
};
module.exports = DataStream;
}),
"[project]/Documents/GitHub/buenasv2/node_modules/ecdsa-sig-formatter/src/param-bytes-for-alg.js [app-route] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

function getParamSize(keySize) {
    var result = (keySize / 8 | 0) + (keySize % 8 === 0 ? 0 : 1);
    return result;
}
var paramBytesForAlg = {
    ES256: getParamSize(256),
    ES384: getParamSize(384),
    ES512: getParamSize(521)
};
function getParamBytesForAlg(alg) {
    var paramBytes = paramBytesForAlg[alg];
    if (paramBytes) {
        return paramBytes;
    }
    throw new Error('Unknown algorithm "' + alg + '"');
}
module.exports = getParamBytesForAlg;
}),
"[project]/Documents/GitHub/buenasv2/node_modules/ecdsa-sig-formatter/src/ecdsa-sig-formatter.js [app-route] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

var Buffer = __turbopack_context__.r("[project]/Documents/GitHub/buenasv2/node_modules/safe-buffer/index.js [app-route] (ecmascript)").Buffer;
var getParamBytesForAlg = __turbopack_context__.r("[project]/Documents/GitHub/buenasv2/node_modules/ecdsa-sig-formatter/src/param-bytes-for-alg.js [app-route] (ecmascript)");
var MAX_OCTET = 0x80, CLASS_UNIVERSAL = 0, PRIMITIVE_BIT = 0x20, TAG_SEQ = 0x10, TAG_INT = 0x02, ENCODED_TAG_SEQ = TAG_SEQ | PRIMITIVE_BIT | CLASS_UNIVERSAL << 6, ENCODED_TAG_INT = TAG_INT | CLASS_UNIVERSAL << 6;
function base64Url(base64) {
    return base64.replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}
function signatureAsBuffer(signature) {
    if (Buffer.isBuffer(signature)) {
        return signature;
    } else if ('string' === typeof signature) {
        return Buffer.from(signature, 'base64');
    }
    throw new TypeError('ECDSA signature must be a Base64 string or a Buffer');
}
function derToJose(signature, alg) {
    signature = signatureAsBuffer(signature);
    var paramBytes = getParamBytesForAlg(alg);
    // the DER encoded param should at most be the param size, plus a padding
    // zero, since due to being a signed integer
    var maxEncodedParamLength = paramBytes + 1;
    var inputLength = signature.length;
    var offset = 0;
    if (signature[offset++] !== ENCODED_TAG_SEQ) {
        throw new Error('Could not find expected "seq"');
    }
    var seqLength = signature[offset++];
    if (seqLength === (MAX_OCTET | 1)) {
        seqLength = signature[offset++];
    }
    if (inputLength - offset < seqLength) {
        throw new Error('"seq" specified length of "' + seqLength + '", only "' + (inputLength - offset) + '" remaining');
    }
    if (signature[offset++] !== ENCODED_TAG_INT) {
        throw new Error('Could not find expected "int" for "r"');
    }
    var rLength = signature[offset++];
    if (inputLength - offset - 2 < rLength) {
        throw new Error('"r" specified length of "' + rLength + '", only "' + (inputLength - offset - 2) + '" available');
    }
    if (maxEncodedParamLength < rLength) {
        throw new Error('"r" specified length of "' + rLength + '", max of "' + maxEncodedParamLength + '" is acceptable');
    }
    var rOffset = offset;
    offset += rLength;
    if (signature[offset++] !== ENCODED_TAG_INT) {
        throw new Error('Could not find expected "int" for "s"');
    }
    var sLength = signature[offset++];
    if (inputLength - offset !== sLength) {
        throw new Error('"s" specified length of "' + sLength + '", expected "' + (inputLength - offset) + '"');
    }
    if (maxEncodedParamLength < sLength) {
        throw new Error('"s" specified length of "' + sLength + '", max of "' + maxEncodedParamLength + '" is acceptable');
    }
    var sOffset = offset;
    offset += sLength;
    if (offset !== inputLength) {
        throw new Error('Expected to consume entire buffer, but "' + (inputLength - offset) + '" bytes remain');
    }
    var rPadding = paramBytes - rLength, sPadding = paramBytes - sLength;
    var dst = Buffer.allocUnsafe(rPadding + rLength + sPadding + sLength);
    for(offset = 0; offset < rPadding; ++offset){
        dst[offset] = 0;
    }
    signature.copy(dst, offset, rOffset + Math.max(-rPadding, 0), rOffset + rLength);
    offset = paramBytes;
    for(var o = offset; offset < o + sPadding; ++offset){
        dst[offset] = 0;
    }
    signature.copy(dst, offset, sOffset + Math.max(-sPadding, 0), sOffset + sLength);
    dst = dst.toString('base64');
    dst = base64Url(dst);
    return dst;
}
function countPadding(buf, start, stop) {
    var padding = 0;
    while(start + padding < stop && buf[start + padding] === 0){
        ++padding;
    }
    var needsSign = buf[start + padding] >= MAX_OCTET;
    if (needsSign) {
        --padding;
    }
    return padding;
}
function joseToDer(signature, alg) {
    signature = signatureAsBuffer(signature);
    var paramBytes = getParamBytesForAlg(alg);
    var signatureBytes = signature.length;
    if (signatureBytes !== paramBytes * 2) {
        throw new TypeError('"' + alg + '" signatures must be "' + paramBytes * 2 + '" bytes, saw "' + signatureBytes + '"');
    }
    var rPadding = countPadding(signature, 0, paramBytes);
    var sPadding = countPadding(signature, paramBytes, signature.length);
    var rLength = paramBytes - rPadding;
    var sLength = paramBytes - sPadding;
    var rsBytes = 1 + 1 + rLength + 1 + 1 + sLength;
    var shortLength = rsBytes < MAX_OCTET;
    var dst = Buffer.allocUnsafe((shortLength ? 2 : 3) + rsBytes);
    var offset = 0;
    dst[offset++] = ENCODED_TAG_SEQ;
    if (shortLength) {
        // Bit 8 has value "0"
        // bits 7-1 give the length.
        dst[offset++] = rsBytes;
    } else {
        // Bit 8 of first octet has value "1"
        // bits 7-1 give the number of additional length octets.
        dst[offset++] = MAX_OCTET | 1;
        // length, base 256
        dst[offset++] = rsBytes & 0xff;
    }
    dst[offset++] = ENCODED_TAG_INT;
    dst[offset++] = rLength;
    if (rPadding < 0) {
        dst[offset++] = 0;
        offset += signature.copy(dst, offset, 0, paramBytes);
    } else {
        offset += signature.copy(dst, offset, rPadding, paramBytes);
    }
    dst[offset++] = ENCODED_TAG_INT;
    dst[offset++] = sLength;
    if (sPadding < 0) {
        dst[offset++] = 0;
        signature.copy(dst, offset, paramBytes);
    } else {
        signature.copy(dst, offset, paramBytes + sPadding);
    }
    return dst;
}
module.exports = {
    derToJose: derToJose,
    joseToDer: joseToDer
};
}),
"[project]/Documents/GitHub/buenasv2/node_modules/buffer-equal-constant-time/index.js [app-route] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

/*jshint node:true */ var Buffer = __turbopack_context__.r("[externals]/buffer [external] (buffer, cjs)").Buffer; // browserify
var SlowBuffer = __turbopack_context__.r("[externals]/buffer [external] (buffer, cjs)").SlowBuffer;
module.exports = bufferEq;
function bufferEq(a, b) {
    // shortcutting on type is necessary for correctness
    if (!Buffer.isBuffer(a) || !Buffer.isBuffer(b)) {
        return false;
    }
    // buffer sizes should be well-known information, so despite this
    // shortcutting, it doesn't leak any information about the *contents* of the
    // buffers.
    if (a.length !== b.length) {
        return false;
    }
    var c = 0;
    for(var i = 0; i < a.length; i++){
        /*jshint bitwise:false */ c |= a[i] ^ b[i]; // XOR
    }
    return c === 0;
}
bufferEq.install = function() {
    Buffer.prototype.equal = SlowBuffer.prototype.equal = function equal(that) {
        return bufferEq(this, that);
    };
};
var origBufEqual = Buffer.prototype.equal;
var origSlowBufEqual = SlowBuffer.prototype.equal;
bufferEq.restore = function() {
    Buffer.prototype.equal = origBufEqual;
    SlowBuffer.prototype.equal = origSlowBufEqual;
};
}),
"[project]/Documents/GitHub/buenasv2/node_modules/jwa/index.js [app-route] (ecmascript)", ((__turbopack_context__, module, exports) => {

var Buffer = __turbopack_context__.r("[project]/Documents/GitHub/buenasv2/node_modules/safe-buffer/index.js [app-route] (ecmascript)").Buffer;
var crypto = __turbopack_context__.r("[externals]/crypto [external] (crypto, cjs)");
var formatEcdsa = __turbopack_context__.r("[project]/Documents/GitHub/buenasv2/node_modules/ecdsa-sig-formatter/src/ecdsa-sig-formatter.js [app-route] (ecmascript)");
var util = __turbopack_context__.r("[externals]/util [external] (util, cjs)");
var MSG_INVALID_ALGORITHM = '"%s" is not a valid algorithm.\n  Supported algorithms are:\n  "HS256", "HS384", "HS512", "RS256", "RS384", "RS512", "PS256", "PS384", "PS512", "ES256", "ES384", "ES512" and "none".';
var MSG_INVALID_SECRET = 'secret must be a string or buffer';
var MSG_INVALID_VERIFIER_KEY = 'key must be a string or a buffer';
var MSG_INVALID_SIGNER_KEY = 'key must be a string, a buffer or an object';
var supportsKeyObjects = typeof crypto.createPublicKey === 'function';
if (supportsKeyObjects) {
    MSG_INVALID_VERIFIER_KEY += ' or a KeyObject';
    MSG_INVALID_SECRET += 'or a KeyObject';
}
function checkIsPublicKey(key) {
    if (Buffer.isBuffer(key)) {
        return;
    }
    if (typeof key === 'string') {
        return;
    }
    if (!supportsKeyObjects) {
        throw typeError(MSG_INVALID_VERIFIER_KEY);
    }
    if (typeof key !== 'object') {
        throw typeError(MSG_INVALID_VERIFIER_KEY);
    }
    if (typeof key.type !== 'string') {
        throw typeError(MSG_INVALID_VERIFIER_KEY);
    }
    if (typeof key.asymmetricKeyType !== 'string') {
        throw typeError(MSG_INVALID_VERIFIER_KEY);
    }
    if (typeof key.export !== 'function') {
        throw typeError(MSG_INVALID_VERIFIER_KEY);
    }
}
;
function checkIsPrivateKey(key) {
    if (Buffer.isBuffer(key)) {
        return;
    }
    if (typeof key === 'string') {
        return;
    }
    if (typeof key === 'object') {
        return;
    }
    throw typeError(MSG_INVALID_SIGNER_KEY);
}
;
function checkIsSecretKey(key) {
    if (Buffer.isBuffer(key)) {
        return;
    }
    if (typeof key === 'string') {
        return key;
    }
    if (!supportsKeyObjects) {
        throw typeError(MSG_INVALID_SECRET);
    }
    if (typeof key !== 'object') {
        throw typeError(MSG_INVALID_SECRET);
    }
    if (key.type !== 'secret') {
        throw typeError(MSG_INVALID_SECRET);
    }
    if (typeof key.export !== 'function') {
        throw typeError(MSG_INVALID_SECRET);
    }
}
function fromBase64(base64) {
    return base64.replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}
function toBase64(base64url) {
    base64url = base64url.toString();
    var padding = 4 - base64url.length % 4;
    if (padding !== 4) {
        for(var i = 0; i < padding; ++i){
            base64url += '=';
        }
    }
    return base64url.replace(/\-/g, '+').replace(/_/g, '/');
}
function typeError(template) {
    var args = [].slice.call(arguments, 1);
    var errMsg = util.format.bind(util, template).apply(null, args);
    return new TypeError(errMsg);
}
function bufferOrString(obj) {
    return Buffer.isBuffer(obj) || typeof obj === 'string';
}
function normalizeInput(thing) {
    if (!bufferOrString(thing)) thing = JSON.stringify(thing);
    return thing;
}
function createHmacSigner(bits) {
    return function sign(thing, secret) {
        checkIsSecretKey(secret);
        thing = normalizeInput(thing);
        var hmac = crypto.createHmac('sha' + bits, secret);
        var sig = (hmac.update(thing), hmac.digest('base64'));
        return fromBase64(sig);
    };
}
var bufferEqual;
var timingSafeEqual = 'timingSafeEqual' in crypto ? function timingSafeEqual(a, b) {
    if (a.byteLength !== b.byteLength) {
        return false;
    }
    return crypto.timingSafeEqual(a, b);
} : function timingSafeEqual(a, b) {
    if (!bufferEqual) {
        bufferEqual = __turbopack_context__.r("[project]/Documents/GitHub/buenasv2/node_modules/buffer-equal-constant-time/index.js [app-route] (ecmascript)");
    }
    return bufferEqual(a, b);
};
function createHmacVerifier(bits) {
    return function verify(thing, signature, secret) {
        var computedSig = createHmacSigner(bits)(thing, secret);
        return timingSafeEqual(Buffer.from(signature), Buffer.from(computedSig));
    };
}
function createKeySigner(bits) {
    return function sign(thing, privateKey) {
        checkIsPrivateKey(privateKey);
        thing = normalizeInput(thing);
        // Even though we are specifying "RSA" here, this works with ECDSA
        // keys as well.
        var signer = crypto.createSign('RSA-SHA' + bits);
        var sig = (signer.update(thing), signer.sign(privateKey, 'base64'));
        return fromBase64(sig);
    };
}
function createKeyVerifier(bits) {
    return function verify(thing, signature, publicKey) {
        checkIsPublicKey(publicKey);
        thing = normalizeInput(thing);
        signature = toBase64(signature);
        var verifier = crypto.createVerify('RSA-SHA' + bits);
        verifier.update(thing);
        return verifier.verify(publicKey, signature, 'base64');
    };
}
function createPSSKeySigner(bits) {
    return function sign(thing, privateKey) {
        checkIsPrivateKey(privateKey);
        thing = normalizeInput(thing);
        var signer = crypto.createSign('RSA-SHA' + bits);
        var sig = (signer.update(thing), signer.sign({
            key: privateKey,
            padding: crypto.constants.RSA_PKCS1_PSS_PADDING,
            saltLength: crypto.constants.RSA_PSS_SALTLEN_DIGEST
        }, 'base64'));
        return fromBase64(sig);
    };
}
function createPSSKeyVerifier(bits) {
    return function verify(thing, signature, publicKey) {
        checkIsPublicKey(publicKey);
        thing = normalizeInput(thing);
        signature = toBase64(signature);
        var verifier = crypto.createVerify('RSA-SHA' + bits);
        verifier.update(thing);
        return verifier.verify({
            key: publicKey,
            padding: crypto.constants.RSA_PKCS1_PSS_PADDING,
            saltLength: crypto.constants.RSA_PSS_SALTLEN_DIGEST
        }, signature, 'base64');
    };
}
function createECDSASigner(bits) {
    var inner = createKeySigner(bits);
    return function sign() {
        var signature = inner.apply(null, arguments);
        signature = formatEcdsa.derToJose(signature, 'ES' + bits);
        return signature;
    };
}
function createECDSAVerifer(bits) {
    var inner = createKeyVerifier(bits);
    return function verify(thing, signature, publicKey) {
        signature = formatEcdsa.joseToDer(signature, 'ES' + bits).toString('base64');
        var result = inner(thing, signature, publicKey);
        return result;
    };
}
function createNoneSigner() {
    return function sign() {
        return '';
    };
}
function createNoneVerifier() {
    return function verify(thing, signature) {
        return signature === '';
    };
}
module.exports = function jwa(algorithm) {
    var signerFactories = {
        hs: createHmacSigner,
        rs: createKeySigner,
        ps: createPSSKeySigner,
        es: createECDSASigner,
        none: createNoneSigner
    };
    var verifierFactories = {
        hs: createHmacVerifier,
        rs: createKeyVerifier,
        ps: createPSSKeyVerifier,
        es: createECDSAVerifer,
        none: createNoneVerifier
    };
    var match = algorithm.match(/^(RS|PS|ES|HS)(256|384|512)$|^(none)$/);
    if (!match) throw typeError(MSG_INVALID_ALGORITHM, algorithm);
    var algo = (match[1] || match[3]).toLowerCase();
    var bits = match[2];
    return {
        sign: signerFactories[algo](bits),
        verify: verifierFactories[algo](bits)
    };
};
}),
"[project]/Documents/GitHub/buenasv2/node_modules/jws/lib/tostring.js [app-route] (ecmascript)", ((__turbopack_context__, module, exports) => {

/*global module*/ var Buffer = __turbopack_context__.r("[externals]/buffer [external] (buffer, cjs)").Buffer;
module.exports = function toString(obj) {
    if (typeof obj === 'string') return obj;
    if (typeof obj === 'number' || Buffer.isBuffer(obj)) return obj.toString();
    return JSON.stringify(obj);
};
}),
"[project]/Documents/GitHub/buenasv2/node_modules/jws/lib/sign-stream.js [app-route] (ecmascript)", ((__turbopack_context__, module, exports) => {

/*global module*/ var Buffer = __turbopack_context__.r("[project]/Documents/GitHub/buenasv2/node_modules/safe-buffer/index.js [app-route] (ecmascript)").Buffer;
var DataStream = __turbopack_context__.r("[project]/Documents/GitHub/buenasv2/node_modules/jws/lib/data-stream.js [app-route] (ecmascript)");
var jwa = __turbopack_context__.r("[project]/Documents/GitHub/buenasv2/node_modules/jwa/index.js [app-route] (ecmascript)");
var Stream = __turbopack_context__.r("[externals]/stream [external] (stream, cjs)");
var toString = __turbopack_context__.r("[project]/Documents/GitHub/buenasv2/node_modules/jws/lib/tostring.js [app-route] (ecmascript)");
var util = __turbopack_context__.r("[externals]/util [external] (util, cjs)");
function base64url(string, encoding) {
    return Buffer.from(string, encoding).toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}
function jwsSecuredInput(header, payload, encoding) {
    encoding = encoding || 'utf8';
    var encodedHeader = base64url(toString(header), 'binary');
    var encodedPayload = base64url(toString(payload), encoding);
    return util.format('%s.%s', encodedHeader, encodedPayload);
}
function jwsSign(opts) {
    var header = opts.header;
    var payload = opts.payload;
    var secretOrKey = opts.secret || opts.privateKey;
    var encoding = opts.encoding;
    var algo = jwa(header.alg);
    var securedInput = jwsSecuredInput(header, payload, encoding);
    var signature = algo.sign(securedInput, secretOrKey);
    return util.format('%s.%s', securedInput, signature);
}
function SignStream(opts) {
    var secret = opts.secret;
    secret = secret == null ? opts.privateKey : secret;
    secret = secret == null ? opts.key : secret;
    if (/^hs/i.test(opts.header.alg) === true && secret == null) {
        throw new TypeError('secret must be a string or buffer or a KeyObject');
    }
    var secretStream = new DataStream(secret);
    this.readable = true;
    this.header = opts.header;
    this.encoding = opts.encoding;
    this.secret = this.privateKey = this.key = secretStream;
    this.payload = new DataStream(opts.payload);
    this.secret.once('close', (function() {
        if (!this.payload.writable && this.readable) this.sign();
    }).bind(this));
    this.payload.once('close', (function() {
        if (!this.secret.writable && this.readable) this.sign();
    }).bind(this));
}
util.inherits(SignStream, Stream);
SignStream.prototype.sign = function sign() {
    try {
        var signature = jwsSign({
            header: this.header,
            payload: this.payload.buffer,
            secret: this.secret.buffer,
            encoding: this.encoding
        });
        this.emit('done', signature);
        this.emit('data', signature);
        this.emit('end');
        this.readable = false;
        return signature;
    } catch (e) {
        this.readable = false;
        this.emit('error', e);
        this.emit('close');
    }
};
SignStream.sign = jwsSign;
module.exports = SignStream;
}),
"[project]/Documents/GitHub/buenasv2/node_modules/jws/lib/verify-stream.js [app-route] (ecmascript)", ((__turbopack_context__, module, exports) => {

/*global module*/ var Buffer = __turbopack_context__.r("[project]/Documents/GitHub/buenasv2/node_modules/safe-buffer/index.js [app-route] (ecmascript)").Buffer;
var DataStream = __turbopack_context__.r("[project]/Documents/GitHub/buenasv2/node_modules/jws/lib/data-stream.js [app-route] (ecmascript)");
var jwa = __turbopack_context__.r("[project]/Documents/GitHub/buenasv2/node_modules/jwa/index.js [app-route] (ecmascript)");
var Stream = __turbopack_context__.r("[externals]/stream [external] (stream, cjs)");
var toString = __turbopack_context__.r("[project]/Documents/GitHub/buenasv2/node_modules/jws/lib/tostring.js [app-route] (ecmascript)");
var util = __turbopack_context__.r("[externals]/util [external] (util, cjs)");
var JWS_REGEX = /^[a-zA-Z0-9\-_]+?\.[a-zA-Z0-9\-_]+?\.([a-zA-Z0-9\-_]+)?$/;
function isObject(thing) {
    return Object.prototype.toString.call(thing) === '[object Object]';
}
function safeJsonParse(thing) {
    if (isObject(thing)) return thing;
    try {
        return JSON.parse(thing);
    } catch (e) {
        return undefined;
    }
}
function headerFromJWS(jwsSig) {
    var encodedHeader = jwsSig.split('.', 1)[0];
    return safeJsonParse(Buffer.from(encodedHeader, 'base64').toString('binary'));
}
function securedInputFromJWS(jwsSig) {
    return jwsSig.split('.', 2).join('.');
}
function signatureFromJWS(jwsSig) {
    return jwsSig.split('.')[2];
}
function payloadFromJWS(jwsSig, encoding) {
    encoding = encoding || 'utf8';
    var payload = jwsSig.split('.')[1];
    return Buffer.from(payload, 'base64').toString(encoding);
}
function isValidJws(string) {
    return JWS_REGEX.test(string) && !!headerFromJWS(string);
}
function jwsVerify(jwsSig, algorithm, secretOrKey) {
    if (!algorithm) {
        var err = new Error("Missing algorithm parameter for jws.verify");
        err.code = "MISSING_ALGORITHM";
        throw err;
    }
    jwsSig = toString(jwsSig);
    var signature = signatureFromJWS(jwsSig);
    var securedInput = securedInputFromJWS(jwsSig);
    var algo = jwa(algorithm);
    return algo.verify(securedInput, signature, secretOrKey);
}
function jwsDecode(jwsSig, opts) {
    opts = opts || {};
    jwsSig = toString(jwsSig);
    if (!isValidJws(jwsSig)) return null;
    var header = headerFromJWS(jwsSig);
    if (!header) return null;
    var payload = payloadFromJWS(jwsSig);
    if (header.typ === 'JWT' || opts.json) payload = JSON.parse(payload, opts.encoding);
    return {
        header: header,
        payload: payload,
        signature: signatureFromJWS(jwsSig)
    };
}
function VerifyStream(opts) {
    opts = opts || {};
    var secretOrKey = opts.secret;
    secretOrKey = secretOrKey == null ? opts.publicKey : secretOrKey;
    secretOrKey = secretOrKey == null ? opts.key : secretOrKey;
    if (/^hs/i.test(opts.algorithm) === true && secretOrKey == null) {
        throw new TypeError('secret must be a string or buffer or a KeyObject');
    }
    var secretStream = new DataStream(secretOrKey);
    this.readable = true;
    this.algorithm = opts.algorithm;
    this.encoding = opts.encoding;
    this.secret = this.publicKey = this.key = secretStream;
    this.signature = new DataStream(opts.signature);
    this.secret.once('close', (function() {
        if (!this.signature.writable && this.readable) this.verify();
    }).bind(this));
    this.signature.once('close', (function() {
        if (!this.secret.writable && this.readable) this.verify();
    }).bind(this));
}
util.inherits(VerifyStream, Stream);
VerifyStream.prototype.verify = function verify() {
    try {
        var valid = jwsVerify(this.signature.buffer, this.algorithm, this.key.buffer);
        var obj = jwsDecode(this.signature.buffer, this.encoding);
        this.emit('done', valid, obj);
        this.emit('data', valid);
        this.emit('end');
        this.readable = false;
        return valid;
    } catch (e) {
        this.readable = false;
        this.emit('error', e);
        this.emit('close');
    }
};
VerifyStream.decode = jwsDecode;
VerifyStream.isValid = isValidJws;
VerifyStream.verify = jwsVerify;
module.exports = VerifyStream;
}),
"[project]/Documents/GitHub/buenasv2/node_modules/jws/index.js [app-route] (ecmascript)", ((__turbopack_context__, module, exports) => {

/*global exports*/ var SignStream = __turbopack_context__.r("[project]/Documents/GitHub/buenasv2/node_modules/jws/lib/sign-stream.js [app-route] (ecmascript)");
var VerifyStream = __turbopack_context__.r("[project]/Documents/GitHub/buenasv2/node_modules/jws/lib/verify-stream.js [app-route] (ecmascript)");
var ALGORITHMS = [
    'HS256',
    'HS384',
    'HS512',
    'RS256',
    'RS384',
    'RS512',
    'PS256',
    'PS384',
    'PS512',
    'ES256',
    'ES384',
    'ES512'
];
exports.ALGORITHMS = ALGORITHMS;
exports.sign = SignStream.sign;
exports.verify = VerifyStream.verify;
exports.decode = VerifyStream.decode;
exports.isValid = VerifyStream.isValid;
exports.createSign = function createSign(opts) {
    return new SignStream(opts);
};
exports.createVerify = function createVerify(opts) {
    return new VerifyStream(opts);
};
}),
"[project]/Documents/GitHub/buenasv2/node_modules/jsonwebtoken/decode.js [app-route] (ecmascript)", ((__turbopack_context__, module, exports) => {

var jws = __turbopack_context__.r("[project]/Documents/GitHub/buenasv2/node_modules/jws/index.js [app-route] (ecmascript)");
module.exports = function(jwt, options) {
    options = options || {};
    var decoded = jws.decode(jwt, options);
    if (!decoded) {
        return null;
    }
    var payload = decoded.payload;
    //try parse the payload
    if (typeof payload === 'string') {
        try {
            var obj = JSON.parse(payload);
            if (obj !== null && typeof obj === 'object') {
                payload = obj;
            }
        } catch (e) {}
    }
    //return header if `complete` option is enabled.  header includes claims
    //such as `kid` and `alg` used to select the key within a JWKS needed to
    //verify the signature
    if (options.complete === true) {
        return {
            header: decoded.header,
            payload: payload,
            signature: decoded.signature
        };
    }
    return payload;
};
}),
"[project]/Documents/GitHub/buenasv2/node_modules/jsonwebtoken/lib/JsonWebTokenError.js [app-route] (ecmascript)", ((__turbopack_context__, module, exports) => {

var JsonWebTokenError = function(message, error) {
    Error.call(this, message);
    if (Error.captureStackTrace) {
        Error.captureStackTrace(this, this.constructor);
    }
    this.name = 'JsonWebTokenError';
    this.message = message;
    if (error) this.inner = error;
};
JsonWebTokenError.prototype = Object.create(Error.prototype);
JsonWebTokenError.prototype.constructor = JsonWebTokenError;
module.exports = JsonWebTokenError;
}),
"[project]/Documents/GitHub/buenasv2/node_modules/jsonwebtoken/lib/NotBeforeError.js [app-route] (ecmascript)", ((__turbopack_context__, module, exports) => {

var JsonWebTokenError = __turbopack_context__.r("[project]/Documents/GitHub/buenasv2/node_modules/jsonwebtoken/lib/JsonWebTokenError.js [app-route] (ecmascript)");
var NotBeforeError = function(message, date) {
    JsonWebTokenError.call(this, message);
    this.name = 'NotBeforeError';
    this.date = date;
};
NotBeforeError.prototype = Object.create(JsonWebTokenError.prototype);
NotBeforeError.prototype.constructor = NotBeforeError;
module.exports = NotBeforeError;
}),
"[project]/Documents/GitHub/buenasv2/node_modules/jsonwebtoken/lib/TokenExpiredError.js [app-route] (ecmascript)", ((__turbopack_context__, module, exports) => {

var JsonWebTokenError = __turbopack_context__.r("[project]/Documents/GitHub/buenasv2/node_modules/jsonwebtoken/lib/JsonWebTokenError.js [app-route] (ecmascript)");
var TokenExpiredError = function(message, expiredAt) {
    JsonWebTokenError.call(this, message);
    this.name = 'TokenExpiredError';
    this.expiredAt = expiredAt;
};
TokenExpiredError.prototype = Object.create(JsonWebTokenError.prototype);
TokenExpiredError.prototype.constructor = TokenExpiredError;
module.exports = TokenExpiredError;
}),
"[project]/Documents/GitHub/buenasv2/node_modules/ms/index.js [app-route] (ecmascript)", ((__turbopack_context__, module, exports) => {

/**
 * Helpers.
 */ var s = 1000;
var m = s * 60;
var h = m * 60;
var d = h * 24;
var w = d * 7;
var y = d * 365.25;
/**
 * Parse or format the given `val`.
 *
 * Options:
 *
 *  - `long` verbose formatting [false]
 *
 * @param {String|Number} val
 * @param {Object} [options]
 * @throws {Error} throw an error if val is not a non-empty string or a number
 * @return {String|Number}
 * @api public
 */ module.exports = function(val, options) {
    options = options || {};
    var type = typeof val;
    if (type === 'string' && val.length > 0) {
        return parse(val);
    } else if (type === 'number' && isFinite(val)) {
        return options.long ? fmtLong(val) : fmtShort(val);
    }
    throw new Error('val is not a non-empty string or a valid number. val=' + JSON.stringify(val));
};
/**
 * Parse the given `str` and return milliseconds.
 *
 * @param {String} str
 * @return {Number}
 * @api private
 */ function parse(str) {
    str = String(str);
    if (str.length > 100) {
        return;
    }
    var match = /^(-?(?:\d+)?\.?\d+) *(milliseconds?|msecs?|ms|seconds?|secs?|s|minutes?|mins?|m|hours?|hrs?|h|days?|d|weeks?|w|years?|yrs?|y)?$/i.exec(str);
    if (!match) {
        return;
    }
    var n = parseFloat(match[1]);
    var type = (match[2] || 'ms').toLowerCase();
    switch(type){
        case 'years':
        case 'year':
        case 'yrs':
        case 'yr':
        case 'y':
            return n * y;
        case 'weeks':
        case 'week':
        case 'w':
            return n * w;
        case 'days':
        case 'day':
        case 'd':
            return n * d;
        case 'hours':
        case 'hour':
        case 'hrs':
        case 'hr':
        case 'h':
            return n * h;
        case 'minutes':
        case 'minute':
        case 'mins':
        case 'min':
        case 'm':
            return n * m;
        case 'seconds':
        case 'second':
        case 'secs':
        case 'sec':
        case 's':
            return n * s;
        case 'milliseconds':
        case 'millisecond':
        case 'msecs':
        case 'msec':
        case 'ms':
            return n;
        default:
            return undefined;
    }
}
/**
 * Short format for `ms`.
 *
 * @param {Number} ms
 * @return {String}
 * @api private
 */ function fmtShort(ms) {
    var msAbs = Math.abs(ms);
    if (msAbs >= d) {
        return Math.round(ms / d) + 'd';
    }
    if (msAbs >= h) {
        return Math.round(ms / h) + 'h';
    }
    if (msAbs >= m) {
        return Math.round(ms / m) + 'm';
    }
    if (msAbs >= s) {
        return Math.round(ms / s) + 's';
    }
    return ms + 'ms';
}
/**
 * Long format for `ms`.
 *
 * @param {Number} ms
 * @return {String}
 * @api private
 */ function fmtLong(ms) {
    var msAbs = Math.abs(ms);
    if (msAbs >= d) {
        return plural(ms, msAbs, d, 'day');
    }
    if (msAbs >= h) {
        return plural(ms, msAbs, h, 'hour');
    }
    if (msAbs >= m) {
        return plural(ms, msAbs, m, 'minute');
    }
    if (msAbs >= s) {
        return plural(ms, msAbs, s, 'second');
    }
    return ms + ' ms';
}
/**
 * Pluralization helper.
 */ function plural(ms, msAbs, n, name) {
    var isPlural = msAbs >= n * 1.5;
    return Math.round(ms / n) + ' ' + name + (isPlural ? 's' : '');
}
}),
"[project]/Documents/GitHub/buenasv2/node_modules/jsonwebtoken/lib/timespan.js [app-route] (ecmascript)", ((__turbopack_context__, module, exports) => {

var ms = __turbopack_context__.r("[project]/Documents/GitHub/buenasv2/node_modules/ms/index.js [app-route] (ecmascript)");
module.exports = function(time, iat) {
    var timestamp = iat || Math.floor(Date.now() / 1000);
    if (typeof time === 'string') {
        var milliseconds = ms(time);
        if (typeof milliseconds === 'undefined') {
            return;
        }
        return Math.floor(timestamp + milliseconds / 1000);
    } else if (typeof time === 'number') {
        return timestamp + time;
    } else {
        return;
    }
};
}),
"[project]/Documents/GitHub/buenasv2/node_modules/semver/internal/constants.js [app-route] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

// Note: this is the semver.org version of the spec that it implements
// Not necessarily the package version of this code.
const SEMVER_SPEC_VERSION = '2.0.0';
const MAX_LENGTH = 256;
const MAX_SAFE_INTEGER = Number.MAX_SAFE_INTEGER || /* istanbul ignore next */ 9007199254740991;
// Max safe segment length for coercion.
const MAX_SAFE_COMPONENT_LENGTH = 16;
// Max safe length for a build identifier. The max length minus 6 characters for
// the shortest version with a build 0.0.0+BUILD.
const MAX_SAFE_BUILD_LENGTH = MAX_LENGTH - 6;
const RELEASE_TYPES = [
    'major',
    'premajor',
    'minor',
    'preminor',
    'patch',
    'prepatch',
    'prerelease'
];
module.exports = {
    MAX_LENGTH,
    MAX_SAFE_COMPONENT_LENGTH,
    MAX_SAFE_BUILD_LENGTH,
    MAX_SAFE_INTEGER,
    RELEASE_TYPES,
    SEMVER_SPEC_VERSION,
    FLAG_INCLUDE_PRERELEASE: 0b001,
    FLAG_LOOSE: 0b010
};
}),
"[project]/Documents/GitHub/buenasv2/node_modules/semver/internal/debug.js [app-route] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

const debug = typeof process === 'object' && process.env && process.env.NODE_DEBUG && /\bsemver\b/i.test(process.env.NODE_DEBUG) ? (...args)=>console.error('SEMVER', ...args) : ()=>{};
module.exports = debug;
}),
"[project]/Documents/GitHub/buenasv2/node_modules/semver/internal/re.js [app-route] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

const { MAX_SAFE_COMPONENT_LENGTH, MAX_SAFE_BUILD_LENGTH, MAX_LENGTH } = __turbopack_context__.r("[project]/Documents/GitHub/buenasv2/node_modules/semver/internal/constants.js [app-route] (ecmascript)");
const debug = __turbopack_context__.r("[project]/Documents/GitHub/buenasv2/node_modules/semver/internal/debug.js [app-route] (ecmascript)");
exports = module.exports = {};
// The actual regexps go on exports.re
const re = exports.re = [];
const safeRe = exports.safeRe = [];
const src = exports.src = [];
const safeSrc = exports.safeSrc = [];
const t = exports.t = {};
let R = 0;
const LETTERDASHNUMBER = '[a-zA-Z0-9-]';
// Replace some greedy regex tokens to prevent regex dos issues. These regex are
// used internally via the safeRe object since all inputs in this library get
// normalized first to trim and collapse all extra whitespace. The original
// regexes are exported for userland consumption and lower level usage. A
// future breaking change could export the safer regex only with a note that
// all input should have extra whitespace removed.
const safeRegexReplacements = [
    [
        '\\s',
        1
    ],
    [
        '\\d',
        MAX_LENGTH
    ],
    [
        LETTERDASHNUMBER,
        MAX_SAFE_BUILD_LENGTH
    ]
];
const makeSafeRegex = (value)=>{
    for (const [token, max] of safeRegexReplacements){
        value = value.split(`${token}*`).join(`${token}{0,${max}}`).split(`${token}+`).join(`${token}{1,${max}}`);
    }
    return value;
};
const createToken = (name, value, isGlobal)=>{
    const safe = makeSafeRegex(value);
    const index = R++;
    debug(name, index, value);
    t[name] = index;
    src[index] = value;
    safeSrc[index] = safe;
    re[index] = new RegExp(value, isGlobal ? 'g' : undefined);
    safeRe[index] = new RegExp(safe, isGlobal ? 'g' : undefined);
};
// The following Regular Expressions can be used for tokenizing,
// validating, and parsing SemVer version strings.
// ## Numeric Identifier
// A single `0`, or a non-zero digit followed by zero or more digits.
createToken('NUMERICIDENTIFIER', '0|[1-9]\\d*');
createToken('NUMERICIDENTIFIERLOOSE', '\\d+');
// ## Non-numeric Identifier
// Zero or more digits, followed by a letter or hyphen, and then zero or
// more letters, digits, or hyphens.
createToken('NONNUMERICIDENTIFIER', `\\d*[a-zA-Z-]${LETTERDASHNUMBER}*`);
// ## Main Version
// Three dot-separated numeric identifiers.
createToken('MAINVERSION', `(${src[t.NUMERICIDENTIFIER]})\\.` + `(${src[t.NUMERICIDENTIFIER]})\\.` + `(${src[t.NUMERICIDENTIFIER]})`);
createToken('MAINVERSIONLOOSE', `(${src[t.NUMERICIDENTIFIERLOOSE]})\\.` + `(${src[t.NUMERICIDENTIFIERLOOSE]})\\.` + `(${src[t.NUMERICIDENTIFIERLOOSE]})`);
// ## Pre-release Version Identifier
// A numeric identifier, or a non-numeric identifier.
// Non-numberic identifiers include numberic identifiers but can be longer.
// Therefore non-numberic identifiers must go first.
createToken('PRERELEASEIDENTIFIER', `(?:${src[t.NONNUMERICIDENTIFIER]}|${src[t.NUMERICIDENTIFIER]})`);
createToken('PRERELEASEIDENTIFIERLOOSE', `(?:${src[t.NONNUMERICIDENTIFIER]}|${src[t.NUMERICIDENTIFIERLOOSE]})`);
// ## Pre-release Version
// Hyphen, followed by one or more dot-separated pre-release version
// identifiers.
createToken('PRERELEASE', `(?:-(${src[t.PRERELEASEIDENTIFIER]}(?:\\.${src[t.PRERELEASEIDENTIFIER]})*))`);
createToken('PRERELEASELOOSE', `(?:-?(${src[t.PRERELEASEIDENTIFIERLOOSE]}(?:\\.${src[t.PRERELEASEIDENTIFIERLOOSE]})*))`);
// ## Build Metadata Identifier
// Any combination of digits, letters, or hyphens.
createToken('BUILDIDENTIFIER', `${LETTERDASHNUMBER}+`);
// ## Build Metadata
// Plus sign, followed by one or more period-separated build metadata
// identifiers.
createToken('BUILD', `(?:\\+(${src[t.BUILDIDENTIFIER]}(?:\\.${src[t.BUILDIDENTIFIER]})*))`);
// ## Full Version String
// A main version, followed optionally by a pre-release version and
// build metadata.
// Note that the only major, minor, patch, and pre-release sections of
// the version string are capturing groups.  The build metadata is not a
// capturing group, because it should not ever be used in version
// comparison.
createToken('FULLPLAIN', `v?${src[t.MAINVERSION]}${src[t.PRERELEASE]}?${src[t.BUILD]}?`);
createToken('FULL', `^${src[t.FULLPLAIN]}$`);
// like full, but allows v1.2.3 and =1.2.3, which people do sometimes.
// also, 1.0.0alpha1 (prerelease without the hyphen) which is pretty
// common in the npm registry.
createToken('LOOSEPLAIN', `[v=\\s]*${src[t.MAINVERSIONLOOSE]}${src[t.PRERELEASELOOSE]}?${src[t.BUILD]}?`);
createToken('LOOSE', `^${src[t.LOOSEPLAIN]}$`);
createToken('GTLT', '((?:<|>)?=?)');
// Something like "2.*" or "1.2.x".
// Note that "x.x" is a valid xRange identifer, meaning "any version"
// Only the first item is strictly required.
createToken('XRANGEIDENTIFIERLOOSE', `${src[t.NUMERICIDENTIFIERLOOSE]}|x|X|\\*`);
createToken('XRANGEIDENTIFIER', `${src[t.NUMERICIDENTIFIER]}|x|X|\\*`);
createToken('XRANGEPLAIN', `[v=\\s]*(${src[t.XRANGEIDENTIFIER]})` + `(?:\\.(${src[t.XRANGEIDENTIFIER]})` + `(?:\\.(${src[t.XRANGEIDENTIFIER]})` + `(?:${src[t.PRERELEASE]})?${src[t.BUILD]}?` + `)?)?`);
createToken('XRANGEPLAINLOOSE', `[v=\\s]*(${src[t.XRANGEIDENTIFIERLOOSE]})` + `(?:\\.(${src[t.XRANGEIDENTIFIERLOOSE]})` + `(?:\\.(${src[t.XRANGEIDENTIFIERLOOSE]})` + `(?:${src[t.PRERELEASELOOSE]})?${src[t.BUILD]}?` + `)?)?`);
createToken('XRANGE', `^${src[t.GTLT]}\\s*${src[t.XRANGEPLAIN]}$`);
createToken('XRANGELOOSE', `^${src[t.GTLT]}\\s*${src[t.XRANGEPLAINLOOSE]}$`);
// Coercion.
// Extract anything that could conceivably be a part of a valid semver
createToken('COERCEPLAIN', `${'(^|[^\\d])' + '(\\d{1,'}${MAX_SAFE_COMPONENT_LENGTH}})` + `(?:\\.(\\d{1,${MAX_SAFE_COMPONENT_LENGTH}}))?` + `(?:\\.(\\d{1,${MAX_SAFE_COMPONENT_LENGTH}}))?`);
createToken('COERCE', `${src[t.COERCEPLAIN]}(?:$|[^\\d])`);
createToken('COERCEFULL', src[t.COERCEPLAIN] + `(?:${src[t.PRERELEASE]})?` + `(?:${src[t.BUILD]})?` + `(?:$|[^\\d])`);
createToken('COERCERTL', src[t.COERCE], true);
createToken('COERCERTLFULL', src[t.COERCEFULL], true);
// Tilde ranges.
// Meaning is "reasonably at or greater than"
createToken('LONETILDE', '(?:~>?)');
createToken('TILDETRIM', `(\\s*)${src[t.LONETILDE]}\\s+`, true);
exports.tildeTrimReplace = '$1~';
createToken('TILDE', `^${src[t.LONETILDE]}${src[t.XRANGEPLAIN]}$`);
createToken('TILDELOOSE', `^${src[t.LONETILDE]}${src[t.XRANGEPLAINLOOSE]}$`);
// Caret ranges.
// Meaning is "at least and backwards compatible with"
createToken('LONECARET', '(?:\\^)');
createToken('CARETTRIM', `(\\s*)${src[t.LONECARET]}\\s+`, true);
exports.caretTrimReplace = '$1^';
createToken('CARET', `^${src[t.LONECARET]}${src[t.XRANGEPLAIN]}$`);
createToken('CARETLOOSE', `^${src[t.LONECARET]}${src[t.XRANGEPLAINLOOSE]}$`);
// A simple gt/lt/eq thing, or just "" to indicate "any version"
createToken('COMPARATORLOOSE', `^${src[t.GTLT]}\\s*(${src[t.LOOSEPLAIN]})$|^$`);
createToken('COMPARATOR', `^${src[t.GTLT]}\\s*(${src[t.FULLPLAIN]})$|^$`);
// An expression to strip any whitespace between the gtlt and the thing
// it modifies, so that `> 1.2.3` ==> `>1.2.3`
createToken('COMPARATORTRIM', `(\\s*)${src[t.GTLT]}\\s*(${src[t.LOOSEPLAIN]}|${src[t.XRANGEPLAIN]})`, true);
exports.comparatorTrimReplace = '$1$2$3';
// Something like `1.2.3 - 1.2.4`
// Note that these all use the loose form, because they'll be
// checked against either the strict or loose comparator form
// later.
createToken('HYPHENRANGE', `^\\s*(${src[t.XRANGEPLAIN]})` + `\\s+-\\s+` + `(${src[t.XRANGEPLAIN]})` + `\\s*$`);
createToken('HYPHENRANGELOOSE', `^\\s*(${src[t.XRANGEPLAINLOOSE]})` + `\\s+-\\s+` + `(${src[t.XRANGEPLAINLOOSE]})` + `\\s*$`);
// Star ranges basically just allow anything at all.
createToken('STAR', '(<|>)?=?\\s*\\*');
// >=0.0.0 is like a star
createToken('GTE0', '^\\s*>=\\s*0\\.0\\.0\\s*$');
createToken('GTE0PRE', '^\\s*>=\\s*0\\.0\\.0-0\\s*$');
}),
"[project]/Documents/GitHub/buenasv2/node_modules/semver/internal/parse-options.js [app-route] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

// parse out just the options we care about
const looseOption = Object.freeze({
    loose: true
});
const emptyOpts = Object.freeze({});
const parseOptions = (options)=>{
    if (!options) {
        return emptyOpts;
    }
    if (typeof options !== 'object') {
        return looseOption;
    }
    return options;
};
module.exports = parseOptions;
}),
"[project]/Documents/GitHub/buenasv2/node_modules/semver/internal/identifiers.js [app-route] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

const numeric = /^[0-9]+$/;
const compareIdentifiers = (a, b)=>{
    if (typeof a === 'number' && typeof b === 'number') {
        return a === b ? 0 : a < b ? -1 : 1;
    }
    const anum = numeric.test(a);
    const bnum = numeric.test(b);
    if (anum && bnum) {
        a = +a;
        b = +b;
    }
    return a === b ? 0 : anum && !bnum ? -1 : bnum && !anum ? 1 : a < b ? -1 : 1;
};
const rcompareIdentifiers = (a, b)=>compareIdentifiers(b, a);
module.exports = {
    compareIdentifiers,
    rcompareIdentifiers
};
}),
"[project]/Documents/GitHub/buenasv2/node_modules/semver/classes/semver.js [app-route] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

const debug = __turbopack_context__.r("[project]/Documents/GitHub/buenasv2/node_modules/semver/internal/debug.js [app-route] (ecmascript)");
const { MAX_LENGTH, MAX_SAFE_INTEGER } = __turbopack_context__.r("[project]/Documents/GitHub/buenasv2/node_modules/semver/internal/constants.js [app-route] (ecmascript)");
const { safeRe: re, t } = __turbopack_context__.r("[project]/Documents/GitHub/buenasv2/node_modules/semver/internal/re.js [app-route] (ecmascript)");
const parseOptions = __turbopack_context__.r("[project]/Documents/GitHub/buenasv2/node_modules/semver/internal/parse-options.js [app-route] (ecmascript)");
const { compareIdentifiers } = __turbopack_context__.r("[project]/Documents/GitHub/buenasv2/node_modules/semver/internal/identifiers.js [app-route] (ecmascript)");
class SemVer {
    constructor(version, options){
        options = parseOptions(options);
        if (version instanceof SemVer) {
            if (version.loose === !!options.loose && version.includePrerelease === !!options.includePrerelease) {
                return version;
            } else {
                version = version.version;
            }
        } else if (typeof version !== 'string') {
            throw new TypeError(`Invalid version. Must be a string. Got type "${typeof version}".`);
        }
        if (version.length > MAX_LENGTH) {
            throw new TypeError(`version is longer than ${MAX_LENGTH} characters`);
        }
        debug('SemVer', version, options);
        this.options = options;
        this.loose = !!options.loose;
        // this isn't actually relevant for versions, but keep it so that we
        // don't run into trouble passing this.options around.
        this.includePrerelease = !!options.includePrerelease;
        const m = version.trim().match(options.loose ? re[t.LOOSE] : re[t.FULL]);
        if (!m) {
            throw new TypeError(`Invalid Version: ${version}`);
        }
        this.raw = version;
        // these are actually numbers
        this.major = +m[1];
        this.minor = +m[2];
        this.patch = +m[3];
        if (this.major > MAX_SAFE_INTEGER || this.major < 0) {
            throw new TypeError('Invalid major version');
        }
        if (this.minor > MAX_SAFE_INTEGER || this.minor < 0) {
            throw new TypeError('Invalid minor version');
        }
        if (this.patch > MAX_SAFE_INTEGER || this.patch < 0) {
            throw new TypeError('Invalid patch version');
        }
        // numberify any prerelease numeric ids
        if (!m[4]) {
            this.prerelease = [];
        } else {
            this.prerelease = m[4].split('.').map((id)=>{
                if (/^[0-9]+$/.test(id)) {
                    const num = +id;
                    if (num >= 0 && num < MAX_SAFE_INTEGER) {
                        return num;
                    }
                }
                return id;
            });
        }
        this.build = m[5] ? m[5].split('.') : [];
        this.format();
    }
    format() {
        this.version = `${this.major}.${this.minor}.${this.patch}`;
        if (this.prerelease.length) {
            this.version += `-${this.prerelease.join('.')}`;
        }
        return this.version;
    }
    toString() {
        return this.version;
    }
    compare(other) {
        debug('SemVer.compare', this.version, this.options, other);
        if (!(other instanceof SemVer)) {
            if (typeof other === 'string' && other === this.version) {
                return 0;
            }
            other = new SemVer(other, this.options);
        }
        if (other.version === this.version) {
            return 0;
        }
        return this.compareMain(other) || this.comparePre(other);
    }
    compareMain(other) {
        if (!(other instanceof SemVer)) {
            other = new SemVer(other, this.options);
        }
        if (this.major < other.major) {
            return -1;
        }
        if (this.major > other.major) {
            return 1;
        }
        if (this.minor < other.minor) {
            return -1;
        }
        if (this.minor > other.minor) {
            return 1;
        }
        if (this.patch < other.patch) {
            return -1;
        }
        if (this.patch > other.patch) {
            return 1;
        }
        return 0;
    }
    comparePre(other) {
        if (!(other instanceof SemVer)) {
            other = new SemVer(other, this.options);
        }
        // NOT having a prerelease is > having one
        if (this.prerelease.length && !other.prerelease.length) {
            return -1;
        } else if (!this.prerelease.length && other.prerelease.length) {
            return 1;
        } else if (!this.prerelease.length && !other.prerelease.length) {
            return 0;
        }
        let i = 0;
        do {
            const a = this.prerelease[i];
            const b = other.prerelease[i];
            debug('prerelease compare', i, a, b);
            if (a === undefined && b === undefined) {
                return 0;
            } else if (b === undefined) {
                return 1;
            } else if (a === undefined) {
                return -1;
            } else if (a === b) {
                continue;
            } else {
                return compareIdentifiers(a, b);
            }
        }while (++i)
    }
    compareBuild(other) {
        if (!(other instanceof SemVer)) {
            other = new SemVer(other, this.options);
        }
        let i = 0;
        do {
            const a = this.build[i];
            const b = other.build[i];
            debug('build compare', i, a, b);
            if (a === undefined && b === undefined) {
                return 0;
            } else if (b === undefined) {
                return 1;
            } else if (a === undefined) {
                return -1;
            } else if (a === b) {
                continue;
            } else {
                return compareIdentifiers(a, b);
            }
        }while (++i)
    }
    // preminor will bump the version up to the next minor release, and immediately
    // down to pre-release. premajor and prepatch work the same way.
    inc(release, identifier, identifierBase) {
        if (release.startsWith('pre')) {
            if (!identifier && identifierBase === false) {
                throw new Error('invalid increment argument: identifier is empty');
            }
            // Avoid an invalid semver results
            if (identifier) {
                const match = `-${identifier}`.match(this.options.loose ? re[t.PRERELEASELOOSE] : re[t.PRERELEASE]);
                if (!match || match[1] !== identifier) {
                    throw new Error(`invalid identifier: ${identifier}`);
                }
            }
        }
        switch(release){
            case 'premajor':
                this.prerelease.length = 0;
                this.patch = 0;
                this.minor = 0;
                this.major++;
                this.inc('pre', identifier, identifierBase);
                break;
            case 'preminor':
                this.prerelease.length = 0;
                this.patch = 0;
                this.minor++;
                this.inc('pre', identifier, identifierBase);
                break;
            case 'prepatch':
                // If this is already a prerelease, it will bump to the next version
                // drop any prereleases that might already exist, since they are not
                // relevant at this point.
                this.prerelease.length = 0;
                this.inc('patch', identifier, identifierBase);
                this.inc('pre', identifier, identifierBase);
                break;
            // If the input is a non-prerelease version, this acts the same as
            // prepatch.
            case 'prerelease':
                if (this.prerelease.length === 0) {
                    this.inc('patch', identifier, identifierBase);
                }
                this.inc('pre', identifier, identifierBase);
                break;
            case 'release':
                if (this.prerelease.length === 0) {
                    throw new Error(`version ${this.raw} is not a prerelease`);
                }
                this.prerelease.length = 0;
                break;
            case 'major':
                // If this is a pre-major version, bump up to the same major version.
                // Otherwise increment major.
                // 1.0.0-5 bumps to 1.0.0
                // 1.1.0 bumps to 2.0.0
                if (this.minor !== 0 || this.patch !== 0 || this.prerelease.length === 0) {
                    this.major++;
                }
                this.minor = 0;
                this.patch = 0;
                this.prerelease = [];
                break;
            case 'minor':
                // If this is a pre-minor version, bump up to the same minor version.
                // Otherwise increment minor.
                // 1.2.0-5 bumps to 1.2.0
                // 1.2.1 bumps to 1.3.0
                if (this.patch !== 0 || this.prerelease.length === 0) {
                    this.minor++;
                }
                this.patch = 0;
                this.prerelease = [];
                break;
            case 'patch':
                // If this is not a pre-release version, it will increment the patch.
                // If it is a pre-release it will bump up to the same patch version.
                // 1.2.0-5 patches to 1.2.0
                // 1.2.0 patches to 1.2.1
                if (this.prerelease.length === 0) {
                    this.patch++;
                }
                this.prerelease = [];
                break;
            // This probably shouldn't be used publicly.
            // 1.0.0 'pre' would become 1.0.0-0 which is the wrong direction.
            case 'pre':
                {
                    const base = Number(identifierBase) ? 1 : 0;
                    if (this.prerelease.length === 0) {
                        this.prerelease = [
                            base
                        ];
                    } else {
                        let i = this.prerelease.length;
                        while(--i >= 0){
                            if (typeof this.prerelease[i] === 'number') {
                                this.prerelease[i]++;
                                i = -2;
                            }
                        }
                        if (i === -1) {
                            // didn't increment anything
                            if (identifier === this.prerelease.join('.') && identifierBase === false) {
                                throw new Error('invalid increment argument: identifier already exists');
                            }
                            this.prerelease.push(base);
                        }
                    }
                    if (identifier) {
                        // 1.2.0-beta.1 bumps to 1.2.0-beta.2,
                        // 1.2.0-beta.fooblz or 1.2.0-beta bumps to 1.2.0-beta.0
                        let prerelease = [
                            identifier,
                            base
                        ];
                        if (identifierBase === false) {
                            prerelease = [
                                identifier
                            ];
                        }
                        if (compareIdentifiers(this.prerelease[0], identifier) === 0) {
                            if (isNaN(this.prerelease[1])) {
                                this.prerelease = prerelease;
                            }
                        } else {
                            this.prerelease = prerelease;
                        }
                    }
                    break;
                }
            default:
                throw new Error(`invalid increment argument: ${release}`);
        }
        this.raw = this.format();
        if (this.build.length) {
            this.raw += `+${this.build.join('.')}`;
        }
        return this;
    }
}
module.exports = SemVer;
}),
"[project]/Documents/GitHub/buenasv2/node_modules/semver/functions/parse.js [app-route] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

const SemVer = __turbopack_context__.r("[project]/Documents/GitHub/buenasv2/node_modules/semver/classes/semver.js [app-route] (ecmascript)");
const parse = (version, options, throwErrors = false)=>{
    if (version instanceof SemVer) {
        return version;
    }
    try {
        return new SemVer(version, options);
    } catch (er) {
        if (!throwErrors) {
            return null;
        }
        throw er;
    }
};
module.exports = parse;
}),
"[project]/Documents/GitHub/buenasv2/node_modules/semver/functions/valid.js [app-route] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

const parse = __turbopack_context__.r("[project]/Documents/GitHub/buenasv2/node_modules/semver/functions/parse.js [app-route] (ecmascript)");
const valid = (version, options)=>{
    const v = parse(version, options);
    return v ? v.version : null;
};
module.exports = valid;
}),
"[project]/Documents/GitHub/buenasv2/node_modules/semver/functions/clean.js [app-route] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

const parse = __turbopack_context__.r("[project]/Documents/GitHub/buenasv2/node_modules/semver/functions/parse.js [app-route] (ecmascript)");
const clean = (version, options)=>{
    const s = parse(version.trim().replace(/^[=v]+/, ''), options);
    return s ? s.version : null;
};
module.exports = clean;
}),
"[project]/Documents/GitHub/buenasv2/node_modules/semver/functions/inc.js [app-route] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

const SemVer = __turbopack_context__.r("[project]/Documents/GitHub/buenasv2/node_modules/semver/classes/semver.js [app-route] (ecmascript)");
const inc = (version, release, options, identifier, identifierBase)=>{
    if (typeof options === 'string') {
        identifierBase = identifier;
        identifier = options;
        options = undefined;
    }
    try {
        return new SemVer(version instanceof SemVer ? version.version : version, options).inc(release, identifier, identifierBase).version;
    } catch (er) {
        return null;
    }
};
module.exports = inc;
}),
"[project]/Documents/GitHub/buenasv2/node_modules/semver/functions/diff.js [app-route] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

const parse = __turbopack_context__.r("[project]/Documents/GitHub/buenasv2/node_modules/semver/functions/parse.js [app-route] (ecmascript)");
const diff = (version1, version2)=>{
    const v1 = parse(version1, null, true);
    const v2 = parse(version2, null, true);
    const comparison = v1.compare(v2);
    if (comparison === 0) {
        return null;
    }
    const v1Higher = comparison > 0;
    const highVersion = v1Higher ? v1 : v2;
    const lowVersion = v1Higher ? v2 : v1;
    const highHasPre = !!highVersion.prerelease.length;
    const lowHasPre = !!lowVersion.prerelease.length;
    if (lowHasPre && !highHasPre) {
        // Going from prerelease -> no prerelease requires some special casing
        // If the low version has only a major, then it will always be a major
        // Some examples:
        // 1.0.0-1 -> 1.0.0
        // 1.0.0-1 -> 1.1.1
        // 1.0.0-1 -> 2.0.0
        if (!lowVersion.patch && !lowVersion.minor) {
            return 'major';
        }
        // If the main part has no difference
        if (lowVersion.compareMain(highVersion) === 0) {
            if (lowVersion.minor && !lowVersion.patch) {
                return 'minor';
            }
            return 'patch';
        }
    }
    // add the `pre` prefix if we are going to a prerelease version
    const prefix = highHasPre ? 'pre' : '';
    if (v1.major !== v2.major) {
        return prefix + 'major';
    }
    if (v1.minor !== v2.minor) {
        return prefix + 'minor';
    }
    if (v1.patch !== v2.patch) {
        return prefix + 'patch';
    }
    // high and low are preleases
    return 'prerelease';
};
module.exports = diff;
}),
"[project]/Documents/GitHub/buenasv2/node_modules/semver/functions/major.js [app-route] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

const SemVer = __turbopack_context__.r("[project]/Documents/GitHub/buenasv2/node_modules/semver/classes/semver.js [app-route] (ecmascript)");
const major = (a, loose)=>new SemVer(a, loose).major;
module.exports = major;
}),
"[project]/Documents/GitHub/buenasv2/node_modules/semver/functions/minor.js [app-route] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

const SemVer = __turbopack_context__.r("[project]/Documents/GitHub/buenasv2/node_modules/semver/classes/semver.js [app-route] (ecmascript)");
const minor = (a, loose)=>new SemVer(a, loose).minor;
module.exports = minor;
}),
"[project]/Documents/GitHub/buenasv2/node_modules/semver/functions/patch.js [app-route] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

const SemVer = __turbopack_context__.r("[project]/Documents/GitHub/buenasv2/node_modules/semver/classes/semver.js [app-route] (ecmascript)");
const patch = (a, loose)=>new SemVer(a, loose).patch;
module.exports = patch;
}),
"[project]/Documents/GitHub/buenasv2/node_modules/semver/functions/prerelease.js [app-route] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

const parse = __turbopack_context__.r("[project]/Documents/GitHub/buenasv2/node_modules/semver/functions/parse.js [app-route] (ecmascript)");
const prerelease = (version, options)=>{
    const parsed = parse(version, options);
    return parsed && parsed.prerelease.length ? parsed.prerelease : null;
};
module.exports = prerelease;
}),
"[project]/Documents/GitHub/buenasv2/node_modules/semver/functions/compare.js [app-route] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

const SemVer = __turbopack_context__.r("[project]/Documents/GitHub/buenasv2/node_modules/semver/classes/semver.js [app-route] (ecmascript)");
const compare = (a, b, loose)=>new SemVer(a, loose).compare(new SemVer(b, loose));
module.exports = compare;
}),
"[project]/Documents/GitHub/buenasv2/node_modules/semver/functions/rcompare.js [app-route] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

const compare = __turbopack_context__.r("[project]/Documents/GitHub/buenasv2/node_modules/semver/functions/compare.js [app-route] (ecmascript)");
const rcompare = (a, b, loose)=>compare(b, a, loose);
module.exports = rcompare;
}),
"[project]/Documents/GitHub/buenasv2/node_modules/semver/functions/compare-loose.js [app-route] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

const compare = __turbopack_context__.r("[project]/Documents/GitHub/buenasv2/node_modules/semver/functions/compare.js [app-route] (ecmascript)");
const compareLoose = (a, b)=>compare(a, b, true);
module.exports = compareLoose;
}),
"[project]/Documents/GitHub/buenasv2/node_modules/semver/functions/compare-build.js [app-route] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

const SemVer = __turbopack_context__.r("[project]/Documents/GitHub/buenasv2/node_modules/semver/classes/semver.js [app-route] (ecmascript)");
const compareBuild = (a, b, loose)=>{
    const versionA = new SemVer(a, loose);
    const versionB = new SemVer(b, loose);
    return versionA.compare(versionB) || versionA.compareBuild(versionB);
};
module.exports = compareBuild;
}),
"[project]/Documents/GitHub/buenasv2/node_modules/semver/functions/sort.js [app-route] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

const compareBuild = __turbopack_context__.r("[project]/Documents/GitHub/buenasv2/node_modules/semver/functions/compare-build.js [app-route] (ecmascript)");
const sort = (list, loose)=>list.sort((a, b)=>compareBuild(a, b, loose));
module.exports = sort;
}),
"[project]/Documents/GitHub/buenasv2/node_modules/semver/functions/rsort.js [app-route] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

const compareBuild = __turbopack_context__.r("[project]/Documents/GitHub/buenasv2/node_modules/semver/functions/compare-build.js [app-route] (ecmascript)");
const rsort = (list, loose)=>list.sort((a, b)=>compareBuild(b, a, loose));
module.exports = rsort;
}),
"[project]/Documents/GitHub/buenasv2/node_modules/semver/functions/gt.js [app-route] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

const compare = __turbopack_context__.r("[project]/Documents/GitHub/buenasv2/node_modules/semver/functions/compare.js [app-route] (ecmascript)");
const gt = (a, b, loose)=>compare(a, b, loose) > 0;
module.exports = gt;
}),
"[project]/Documents/GitHub/buenasv2/node_modules/semver/functions/lt.js [app-route] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

const compare = __turbopack_context__.r("[project]/Documents/GitHub/buenasv2/node_modules/semver/functions/compare.js [app-route] (ecmascript)");
const lt = (a, b, loose)=>compare(a, b, loose) < 0;
module.exports = lt;
}),
"[project]/Documents/GitHub/buenasv2/node_modules/semver/functions/eq.js [app-route] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

const compare = __turbopack_context__.r("[project]/Documents/GitHub/buenasv2/node_modules/semver/functions/compare.js [app-route] (ecmascript)");
const eq = (a, b, loose)=>compare(a, b, loose) === 0;
module.exports = eq;
}),
"[project]/Documents/GitHub/buenasv2/node_modules/semver/functions/neq.js [app-route] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

const compare = __turbopack_context__.r("[project]/Documents/GitHub/buenasv2/node_modules/semver/functions/compare.js [app-route] (ecmascript)");
const neq = (a, b, loose)=>compare(a, b, loose) !== 0;
module.exports = neq;
}),
"[project]/Documents/GitHub/buenasv2/node_modules/semver/functions/gte.js [app-route] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

const compare = __turbopack_context__.r("[project]/Documents/GitHub/buenasv2/node_modules/semver/functions/compare.js [app-route] (ecmascript)");
const gte = (a, b, loose)=>compare(a, b, loose) >= 0;
module.exports = gte;
}),
"[project]/Documents/GitHub/buenasv2/node_modules/semver/functions/lte.js [app-route] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

const compare = __turbopack_context__.r("[project]/Documents/GitHub/buenasv2/node_modules/semver/functions/compare.js [app-route] (ecmascript)");
const lte = (a, b, loose)=>compare(a, b, loose) <= 0;
module.exports = lte;
}),
"[project]/Documents/GitHub/buenasv2/node_modules/semver/functions/cmp.js [app-route] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

const eq = __turbopack_context__.r("[project]/Documents/GitHub/buenasv2/node_modules/semver/functions/eq.js [app-route] (ecmascript)");
const neq = __turbopack_context__.r("[project]/Documents/GitHub/buenasv2/node_modules/semver/functions/neq.js [app-route] (ecmascript)");
const gt = __turbopack_context__.r("[project]/Documents/GitHub/buenasv2/node_modules/semver/functions/gt.js [app-route] (ecmascript)");
const gte = __turbopack_context__.r("[project]/Documents/GitHub/buenasv2/node_modules/semver/functions/gte.js [app-route] (ecmascript)");
const lt = __turbopack_context__.r("[project]/Documents/GitHub/buenasv2/node_modules/semver/functions/lt.js [app-route] (ecmascript)");
const lte = __turbopack_context__.r("[project]/Documents/GitHub/buenasv2/node_modules/semver/functions/lte.js [app-route] (ecmascript)");
const cmp = (a, op, b, loose)=>{
    switch(op){
        case '===':
            if (typeof a === 'object') {
                a = a.version;
            }
            if (typeof b === 'object') {
                b = b.version;
            }
            return a === b;
        case '!==':
            if (typeof a === 'object') {
                a = a.version;
            }
            if (typeof b === 'object') {
                b = b.version;
            }
            return a !== b;
        case '':
        case '=':
        case '==':
            return eq(a, b, loose);
        case '!=':
            return neq(a, b, loose);
        case '>':
            return gt(a, b, loose);
        case '>=':
            return gte(a, b, loose);
        case '<':
            return lt(a, b, loose);
        case '<=':
            return lte(a, b, loose);
        default:
            throw new TypeError(`Invalid operator: ${op}`);
    }
};
module.exports = cmp;
}),
"[project]/Documents/GitHub/buenasv2/node_modules/semver/functions/coerce.js [app-route] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

const SemVer = __turbopack_context__.r("[project]/Documents/GitHub/buenasv2/node_modules/semver/classes/semver.js [app-route] (ecmascript)");
const parse = __turbopack_context__.r("[project]/Documents/GitHub/buenasv2/node_modules/semver/functions/parse.js [app-route] (ecmascript)");
const { safeRe: re, t } = __turbopack_context__.r("[project]/Documents/GitHub/buenasv2/node_modules/semver/internal/re.js [app-route] (ecmascript)");
const coerce = (version, options)=>{
    if (version instanceof SemVer) {
        return version;
    }
    if (typeof version === 'number') {
        version = String(version);
    }
    if (typeof version !== 'string') {
        return null;
    }
    options = options || {};
    let match = null;
    if (!options.rtl) {
        match = version.match(options.includePrerelease ? re[t.COERCEFULL] : re[t.COERCE]);
    } else {
        // Find the right-most coercible string that does not share
        // a terminus with a more left-ward coercible string.
        // Eg, '1.2.3.4' wants to coerce '2.3.4', not '3.4' or '4'
        // With includePrerelease option set, '1.2.3.4-rc' wants to coerce '2.3.4-rc', not '2.3.4'
        //
        // Walk through the string checking with a /g regexp
        // Manually set the index so as to pick up overlapping matches.
        // Stop when we get a match that ends at the string end, since no
        // coercible string can be more right-ward without the same terminus.
        const coerceRtlRegex = options.includePrerelease ? re[t.COERCERTLFULL] : re[t.COERCERTL];
        let next;
        while((next = coerceRtlRegex.exec(version)) && (!match || match.index + match[0].length !== version.length)){
            if (!match || next.index + next[0].length !== match.index + match[0].length) {
                match = next;
            }
            coerceRtlRegex.lastIndex = next.index + next[1].length + next[2].length;
        }
        // leave it in a clean state
        coerceRtlRegex.lastIndex = -1;
    }
    if (match === null) {
        return null;
    }
    const major = match[2];
    const minor = match[3] || '0';
    const patch = match[4] || '0';
    const prerelease = options.includePrerelease && match[5] ? `-${match[5]}` : '';
    const build = options.includePrerelease && match[6] ? `+${match[6]}` : '';
    return parse(`${major}.${minor}.${patch}${prerelease}${build}`, options);
};
module.exports = coerce;
}),
"[project]/Documents/GitHub/buenasv2/node_modules/semver/internal/lrucache.js [app-route] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

class LRUCache {
    constructor(){
        this.max = 1000;
        this.map = new Map();
    }
    get(key) {
        const value = this.map.get(key);
        if (value === undefined) {
            return undefined;
        } else {
            // Remove the key from the map and add it to the end
            this.map.delete(key);
            this.map.set(key, value);
            return value;
        }
    }
    delete(key) {
        return this.map.delete(key);
    }
    set(key, value) {
        const deleted = this.delete(key);
        if (!deleted && value !== undefined) {
            // If cache is full, delete the least recently used item
            if (this.map.size >= this.max) {
                const firstKey = this.map.keys().next().value;
                this.delete(firstKey);
            }
            this.map.set(key, value);
        }
        return this;
    }
}
module.exports = LRUCache;
}),
"[project]/Documents/GitHub/buenasv2/node_modules/semver/classes/range.js [app-route] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

const SPACE_CHARACTERS = /\s+/g;
// hoisted class for cyclic dependency
class Range {
    constructor(range, options){
        options = parseOptions(options);
        if (range instanceof Range) {
            if (range.loose === !!options.loose && range.includePrerelease === !!options.includePrerelease) {
                return range;
            } else {
                return new Range(range.raw, options);
            }
        }
        if (range instanceof Comparator) {
            // just put it in the set and return
            this.raw = range.value;
            this.set = [
                [
                    range
                ]
            ];
            this.formatted = undefined;
            return this;
        }
        this.options = options;
        this.loose = !!options.loose;
        this.includePrerelease = !!options.includePrerelease;
        // First reduce all whitespace as much as possible so we do not have to rely
        // on potentially slow regexes like \s*. This is then stored and used for
        // future error messages as well.
        this.raw = range.trim().replace(SPACE_CHARACTERS, ' ');
        // First, split on ||
        this.set = this.raw.split('||')// map the range to a 2d array of comparators
        .map((r)=>this.parseRange(r.trim()))// throw out any comparator lists that are empty
        // this generally means that it was not a valid range, which is allowed
        // in loose mode, but will still throw if the WHOLE range is invalid.
        .filter((c)=>c.length);
        if (!this.set.length) {
            throw new TypeError(`Invalid SemVer Range: ${this.raw}`);
        }
        // if we have any that are not the null set, throw out null sets.
        if (this.set.length > 1) {
            // keep the first one, in case they're all null sets
            const first = this.set[0];
            this.set = this.set.filter((c)=>!isNullSet(c[0]));
            if (this.set.length === 0) {
                this.set = [
                    first
                ];
            } else if (this.set.length > 1) {
                // if we have any that are *, then the range is just *
                for (const c of this.set){
                    if (c.length === 1 && isAny(c[0])) {
                        this.set = [
                            c
                        ];
                        break;
                    }
                }
            }
        }
        this.formatted = undefined;
    }
    get range() {
        if (this.formatted === undefined) {
            this.formatted = '';
            for(let i = 0; i < this.set.length; i++){
                if (i > 0) {
                    this.formatted += '||';
                }
                const comps = this.set[i];
                for(let k = 0; k < comps.length; k++){
                    if (k > 0) {
                        this.formatted += ' ';
                    }
                    this.formatted += comps[k].toString().trim();
                }
            }
        }
        return this.formatted;
    }
    format() {
        return this.range;
    }
    toString() {
        return this.range;
    }
    parseRange(range) {
        // memoize range parsing for performance.
        // this is a very hot path, and fully deterministic.
        const memoOpts = (this.options.includePrerelease && FLAG_INCLUDE_PRERELEASE) | (this.options.loose && FLAG_LOOSE);
        const memoKey = memoOpts + ':' + range;
        const cached = cache.get(memoKey);
        if (cached) {
            return cached;
        }
        const loose = this.options.loose;
        // `1.2.3 - 1.2.4` => `>=1.2.3 <=1.2.4`
        const hr = loose ? re[t.HYPHENRANGELOOSE] : re[t.HYPHENRANGE];
        range = range.replace(hr, hyphenReplace(this.options.includePrerelease));
        debug('hyphen replace', range);
        // `> 1.2.3 < 1.2.5` => `>1.2.3 <1.2.5`
        range = range.replace(re[t.COMPARATORTRIM], comparatorTrimReplace);
        debug('comparator trim', range);
        // `~ 1.2.3` => `~1.2.3`
        range = range.replace(re[t.TILDETRIM], tildeTrimReplace);
        debug('tilde trim', range);
        // `^ 1.2.3` => `^1.2.3`
        range = range.replace(re[t.CARETTRIM], caretTrimReplace);
        debug('caret trim', range);
        // At this point, the range is completely trimmed and
        // ready to be split into comparators.
        let rangeList = range.split(' ').map((comp)=>parseComparator(comp, this.options)).join(' ').split(/\s+/)// >=0.0.0 is equivalent to *
        .map((comp)=>replaceGTE0(comp, this.options));
        if (loose) {
            // in loose mode, throw out any that are not valid comparators
            rangeList = rangeList.filter((comp)=>{
                debug('loose invalid filter', comp, this.options);
                return !!comp.match(re[t.COMPARATORLOOSE]);
            });
        }
        debug('range list', rangeList);
        // if any comparators are the null set, then replace with JUST null set
        // if more than one comparator, remove any * comparators
        // also, don't include the same comparator more than once
        const rangeMap = new Map();
        const comparators = rangeList.map((comp)=>new Comparator(comp, this.options));
        for (const comp of comparators){
            if (isNullSet(comp)) {
                return [
                    comp
                ];
            }
            rangeMap.set(comp.value, comp);
        }
        if (rangeMap.size > 1 && rangeMap.has('')) {
            rangeMap.delete('');
        }
        const result = [
            ...rangeMap.values()
        ];
        cache.set(memoKey, result);
        return result;
    }
    intersects(range, options) {
        if (!(range instanceof Range)) {
            throw new TypeError('a Range is required');
        }
        return this.set.some((thisComparators)=>{
            return isSatisfiable(thisComparators, options) && range.set.some((rangeComparators)=>{
                return isSatisfiable(rangeComparators, options) && thisComparators.every((thisComparator)=>{
                    return rangeComparators.every((rangeComparator)=>{
                        return thisComparator.intersects(rangeComparator, options);
                    });
                });
            });
        });
    }
    // if ANY of the sets match ALL of its comparators, then pass
    test(version) {
        if (!version) {
            return false;
        }
        if (typeof version === 'string') {
            try {
                version = new SemVer(version, this.options);
            } catch (er) {
                return false;
            }
        }
        for(let i = 0; i < this.set.length; i++){
            if (testSet(this.set[i], version, this.options)) {
                return true;
            }
        }
        return false;
    }
}
module.exports = Range;
const LRU = __turbopack_context__.r("[project]/Documents/GitHub/buenasv2/node_modules/semver/internal/lrucache.js [app-route] (ecmascript)");
const cache = new LRU();
const parseOptions = __turbopack_context__.r("[project]/Documents/GitHub/buenasv2/node_modules/semver/internal/parse-options.js [app-route] (ecmascript)");
const Comparator = __turbopack_context__.r("[project]/Documents/GitHub/buenasv2/node_modules/semver/classes/comparator.js [app-route] (ecmascript)");
const debug = __turbopack_context__.r("[project]/Documents/GitHub/buenasv2/node_modules/semver/internal/debug.js [app-route] (ecmascript)");
const SemVer = __turbopack_context__.r("[project]/Documents/GitHub/buenasv2/node_modules/semver/classes/semver.js [app-route] (ecmascript)");
const { safeRe: re, t, comparatorTrimReplace, tildeTrimReplace, caretTrimReplace } = __turbopack_context__.r("[project]/Documents/GitHub/buenasv2/node_modules/semver/internal/re.js [app-route] (ecmascript)");
const { FLAG_INCLUDE_PRERELEASE, FLAG_LOOSE } = __turbopack_context__.r("[project]/Documents/GitHub/buenasv2/node_modules/semver/internal/constants.js [app-route] (ecmascript)");
const isNullSet = (c)=>c.value === '<0.0.0-0';
const isAny = (c)=>c.value === '';
// take a set of comparators and determine whether there
// exists a version which can satisfy it
const isSatisfiable = (comparators, options)=>{
    let result = true;
    const remainingComparators = comparators.slice();
    let testComparator = remainingComparators.pop();
    while(result && remainingComparators.length){
        result = remainingComparators.every((otherComparator)=>{
            return testComparator.intersects(otherComparator, options);
        });
        testComparator = remainingComparators.pop();
    }
    return result;
};
// comprised of xranges, tildes, stars, and gtlt's at this point.
// already replaced the hyphen ranges
// turn into a set of JUST comparators.
const parseComparator = (comp, options)=>{
    comp = comp.replace(re[t.BUILD], '');
    debug('comp', comp, options);
    comp = replaceCarets(comp, options);
    debug('caret', comp);
    comp = replaceTildes(comp, options);
    debug('tildes', comp);
    comp = replaceXRanges(comp, options);
    debug('xrange', comp);
    comp = replaceStars(comp, options);
    debug('stars', comp);
    return comp;
};
const isX = (id)=>!id || id.toLowerCase() === 'x' || id === '*';
// ~, ~> --> * (any, kinda silly)
// ~2, ~2.x, ~2.x.x, ~>2, ~>2.x ~>2.x.x --> >=2.0.0 <3.0.0-0
// ~2.0, ~2.0.x, ~>2.0, ~>2.0.x --> >=2.0.0 <2.1.0-0
// ~1.2, ~1.2.x, ~>1.2, ~>1.2.x --> >=1.2.0 <1.3.0-0
// ~1.2.3, ~>1.2.3 --> >=1.2.3 <1.3.0-0
// ~1.2.0, ~>1.2.0 --> >=1.2.0 <1.3.0-0
// ~0.0.1 --> >=0.0.1 <0.1.0-0
const replaceTildes = (comp, options)=>{
    return comp.trim().split(/\s+/).map((c)=>replaceTilde(c, options)).join(' ');
};
const replaceTilde = (comp, options)=>{
    const r = options.loose ? re[t.TILDELOOSE] : re[t.TILDE];
    return comp.replace(r, (_, M, m, p, pr)=>{
        debug('tilde', comp, _, M, m, p, pr);
        let ret;
        if (isX(M)) {
            ret = '';
        } else if (isX(m)) {
            ret = `>=${M}.0.0 <${+M + 1}.0.0-0`;
        } else if (isX(p)) {
            // ~1.2 == >=1.2.0 <1.3.0-0
            ret = `>=${M}.${m}.0 <${M}.${+m + 1}.0-0`;
        } else if (pr) {
            debug('replaceTilde pr', pr);
            ret = `>=${M}.${m}.${p}-${pr} <${M}.${+m + 1}.0-0`;
        } else {
            // ~1.2.3 == >=1.2.3 <1.3.0-0
            ret = `>=${M}.${m}.${p} <${M}.${+m + 1}.0-0`;
        }
        debug('tilde return', ret);
        return ret;
    });
};
// ^ --> * (any, kinda silly)
// ^2, ^2.x, ^2.x.x --> >=2.0.0 <3.0.0-0
// ^2.0, ^2.0.x --> >=2.0.0 <3.0.0-0
// ^1.2, ^1.2.x --> >=1.2.0 <2.0.0-0
// ^1.2.3 --> >=1.2.3 <2.0.0-0
// ^1.2.0 --> >=1.2.0 <2.0.0-0
// ^0.0.1 --> >=0.0.1 <0.0.2-0
// ^0.1.0 --> >=0.1.0 <0.2.0-0
const replaceCarets = (comp, options)=>{
    return comp.trim().split(/\s+/).map((c)=>replaceCaret(c, options)).join(' ');
};
const replaceCaret = (comp, options)=>{
    debug('caret', comp, options);
    const r = options.loose ? re[t.CARETLOOSE] : re[t.CARET];
    const z = options.includePrerelease ? '-0' : '';
    return comp.replace(r, (_, M, m, p, pr)=>{
        debug('caret', comp, _, M, m, p, pr);
        let ret;
        if (isX(M)) {
            ret = '';
        } else if (isX(m)) {
            ret = `>=${M}.0.0${z} <${+M + 1}.0.0-0`;
        } else if (isX(p)) {
            if (M === '0') {
                ret = `>=${M}.${m}.0${z} <${M}.${+m + 1}.0-0`;
            } else {
                ret = `>=${M}.${m}.0${z} <${+M + 1}.0.0-0`;
            }
        } else if (pr) {
            debug('replaceCaret pr', pr);
            if (M === '0') {
                if (m === '0') {
                    ret = `>=${M}.${m}.${p}-${pr} <${M}.${m}.${+p + 1}-0`;
                } else {
                    ret = `>=${M}.${m}.${p}-${pr} <${M}.${+m + 1}.0-0`;
                }
            } else {
                ret = `>=${M}.${m}.${p}-${pr} <${+M + 1}.0.0-0`;
            }
        } else {
            debug('no pr');
            if (M === '0') {
                if (m === '0') {
                    ret = `>=${M}.${m}.${p}${z} <${M}.${m}.${+p + 1}-0`;
                } else {
                    ret = `>=${M}.${m}.${p}${z} <${M}.${+m + 1}.0-0`;
                }
            } else {
                ret = `>=${M}.${m}.${p} <${+M + 1}.0.0-0`;
            }
        }
        debug('caret return', ret);
        return ret;
    });
};
const replaceXRanges = (comp, options)=>{
    debug('replaceXRanges', comp, options);
    return comp.split(/\s+/).map((c)=>replaceXRange(c, options)).join(' ');
};
const replaceXRange = (comp, options)=>{
    comp = comp.trim();
    const r = options.loose ? re[t.XRANGELOOSE] : re[t.XRANGE];
    return comp.replace(r, (ret, gtlt, M, m, p, pr)=>{
        debug('xRange', comp, ret, gtlt, M, m, p, pr);
        const xM = isX(M);
        const xm = xM || isX(m);
        const xp = xm || isX(p);
        const anyX = xp;
        if (gtlt === '=' && anyX) {
            gtlt = '';
        }
        // if we're including prereleases in the match, then we need
        // to fix this to -0, the lowest possible prerelease value
        pr = options.includePrerelease ? '-0' : '';
        if (xM) {
            if (gtlt === '>' || gtlt === '<') {
                // nothing is allowed
                ret = '<0.0.0-0';
            } else {
                // nothing is forbidden
                ret = '*';
            }
        } else if (gtlt && anyX) {
            // we know patch is an x, because we have any x at all.
            // replace X with 0
            if (xm) {
                m = 0;
            }
            p = 0;
            if (gtlt === '>') {
                // >1 => >=2.0.0
                // >1.2 => >=1.3.0
                gtlt = '>=';
                if (xm) {
                    M = +M + 1;
                    m = 0;
                    p = 0;
                } else {
                    m = +m + 1;
                    p = 0;
                }
            } else if (gtlt === '<=') {
                // <=0.7.x is actually <0.8.0, since any 0.7.x should
                // pass.  Similarly, <=7.x is actually <8.0.0, etc.
                gtlt = '<';
                if (xm) {
                    M = +M + 1;
                } else {
                    m = +m + 1;
                }
            }
            if (gtlt === '<') {
                pr = '-0';
            }
            ret = `${gtlt + M}.${m}.${p}${pr}`;
        } else if (xm) {
            ret = `>=${M}.0.0${pr} <${+M + 1}.0.0-0`;
        } else if (xp) {
            ret = `>=${M}.${m}.0${pr} <${M}.${+m + 1}.0-0`;
        }
        debug('xRange return', ret);
        return ret;
    });
};
// Because * is AND-ed with everything else in the comparator,
// and '' means "any version", just remove the *s entirely.
const replaceStars = (comp, options)=>{
    debug('replaceStars', comp, options);
    // Looseness is ignored here.  star is always as loose as it gets!
    return comp.trim().replace(re[t.STAR], '');
};
const replaceGTE0 = (comp, options)=>{
    debug('replaceGTE0', comp, options);
    return comp.trim().replace(re[options.includePrerelease ? t.GTE0PRE : t.GTE0], '');
};
// This function is passed to string.replace(re[t.HYPHENRANGE])
// M, m, patch, prerelease, build
// 1.2 - 3.4.5 => >=1.2.0 <=3.4.5
// 1.2.3 - 3.4 => >=1.2.0 <3.5.0-0 Any 3.4.x will do
// 1.2 - 3.4 => >=1.2.0 <3.5.0-0
// TODO build?
const hyphenReplace = (incPr)=>($0, from, fM, fm, fp, fpr, fb, to, tM, tm, tp, tpr)=>{
        if (isX(fM)) {
            from = '';
        } else if (isX(fm)) {
            from = `>=${fM}.0.0${incPr ? '-0' : ''}`;
        } else if (isX(fp)) {
            from = `>=${fM}.${fm}.0${incPr ? '-0' : ''}`;
        } else if (fpr) {
            from = `>=${from}`;
        } else {
            from = `>=${from}${incPr ? '-0' : ''}`;
        }
        if (isX(tM)) {
            to = '';
        } else if (isX(tm)) {
            to = `<${+tM + 1}.0.0-0`;
        } else if (isX(tp)) {
            to = `<${tM}.${+tm + 1}.0-0`;
        } else if (tpr) {
            to = `<=${tM}.${tm}.${tp}-${tpr}`;
        } else if (incPr) {
            to = `<${tM}.${tm}.${+tp + 1}-0`;
        } else {
            to = `<=${to}`;
        }
        return `${from} ${to}`.trim();
    };
const testSet = (set, version, options)=>{
    for(let i = 0; i < set.length; i++){
        if (!set[i].test(version)) {
            return false;
        }
    }
    if (version.prerelease.length && !options.includePrerelease) {
        // Find the set of versions that are allowed to have prereleases
        // For example, ^1.2.3-pr.1 desugars to >=1.2.3-pr.1 <2.0.0
        // That should allow `1.2.3-pr.2` to pass.
        // However, `1.2.4-alpha.notready` should NOT be allowed,
        // even though it's within the range set by the comparators.
        for(let i = 0; i < set.length; i++){
            debug(set[i].semver);
            if (set[i].semver === Comparator.ANY) {
                continue;
            }
            if (set[i].semver.prerelease.length > 0) {
                const allowed = set[i].semver;
                if (allowed.major === version.major && allowed.minor === version.minor && allowed.patch === version.patch) {
                    return true;
                }
            }
        }
        // Version has a -pre, but it's not one of the ones we like.
        return false;
    }
    return true;
};
}),
"[project]/Documents/GitHub/buenasv2/node_modules/semver/classes/comparator.js [app-route] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

const ANY = Symbol('SemVer ANY');
// hoisted class for cyclic dependency
class Comparator {
    static get ANY() {
        return ANY;
    }
    constructor(comp, options){
        options = parseOptions(options);
        if (comp instanceof Comparator) {
            if (comp.loose === !!options.loose) {
                return comp;
            } else {
                comp = comp.value;
            }
        }
        comp = comp.trim().split(/\s+/).join(' ');
        debug('comparator', comp, options);
        this.options = options;
        this.loose = !!options.loose;
        this.parse(comp);
        if (this.semver === ANY) {
            this.value = '';
        } else {
            this.value = this.operator + this.semver.version;
        }
        debug('comp', this);
    }
    parse(comp) {
        const r = this.options.loose ? re[t.COMPARATORLOOSE] : re[t.COMPARATOR];
        const m = comp.match(r);
        if (!m) {
            throw new TypeError(`Invalid comparator: ${comp}`);
        }
        this.operator = m[1] !== undefined ? m[1] : '';
        if (this.operator === '=') {
            this.operator = '';
        }
        // if it literally is just '>' or '' then allow anything.
        if (!m[2]) {
            this.semver = ANY;
        } else {
            this.semver = new SemVer(m[2], this.options.loose);
        }
    }
    toString() {
        return this.value;
    }
    test(version) {
        debug('Comparator.test', version, this.options.loose);
        if (this.semver === ANY || version === ANY) {
            return true;
        }
        if (typeof version === 'string') {
            try {
                version = new SemVer(version, this.options);
            } catch (er) {
                return false;
            }
        }
        return cmp(version, this.operator, this.semver, this.options);
    }
    intersects(comp, options) {
        if (!(comp instanceof Comparator)) {
            throw new TypeError('a Comparator is required');
        }
        if (this.operator === '') {
            if (this.value === '') {
                return true;
            }
            return new Range(comp.value, options).test(this.value);
        } else if (comp.operator === '') {
            if (comp.value === '') {
                return true;
            }
            return new Range(this.value, options).test(comp.semver);
        }
        options = parseOptions(options);
        // Special cases where nothing can possibly be lower
        if (options.includePrerelease && (this.value === '<0.0.0-0' || comp.value === '<0.0.0-0')) {
            return false;
        }
        if (!options.includePrerelease && (this.value.startsWith('<0.0.0') || comp.value.startsWith('<0.0.0'))) {
            return false;
        }
        // Same direction increasing (> or >=)
        if (this.operator.startsWith('>') && comp.operator.startsWith('>')) {
            return true;
        }
        // Same direction decreasing (< or <=)
        if (this.operator.startsWith('<') && comp.operator.startsWith('<')) {
            return true;
        }
        // same SemVer and both sides are inclusive (<= or >=)
        if (this.semver.version === comp.semver.version && this.operator.includes('=') && comp.operator.includes('=')) {
            return true;
        }
        // opposite directions less than
        if (cmp(this.semver, '<', comp.semver, options) && this.operator.startsWith('>') && comp.operator.startsWith('<')) {
            return true;
        }
        // opposite directions greater than
        if (cmp(this.semver, '>', comp.semver, options) && this.operator.startsWith('<') && comp.operator.startsWith('>')) {
            return true;
        }
        return false;
    }
}
module.exports = Comparator;
const parseOptions = __turbopack_context__.r("[project]/Documents/GitHub/buenasv2/node_modules/semver/internal/parse-options.js [app-route] (ecmascript)");
const { safeRe: re, t } = __turbopack_context__.r("[project]/Documents/GitHub/buenasv2/node_modules/semver/internal/re.js [app-route] (ecmascript)");
const cmp = __turbopack_context__.r("[project]/Documents/GitHub/buenasv2/node_modules/semver/functions/cmp.js [app-route] (ecmascript)");
const debug = __turbopack_context__.r("[project]/Documents/GitHub/buenasv2/node_modules/semver/internal/debug.js [app-route] (ecmascript)");
const SemVer = __turbopack_context__.r("[project]/Documents/GitHub/buenasv2/node_modules/semver/classes/semver.js [app-route] (ecmascript)");
const Range = __turbopack_context__.r("[project]/Documents/GitHub/buenasv2/node_modules/semver/classes/range.js [app-route] (ecmascript)");
}),
"[project]/Documents/GitHub/buenasv2/node_modules/semver/functions/satisfies.js [app-route] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

const Range = __turbopack_context__.r("[project]/Documents/GitHub/buenasv2/node_modules/semver/classes/range.js [app-route] (ecmascript)");
const satisfies = (version, range, options)=>{
    try {
        range = new Range(range, options);
    } catch (er) {
        return false;
    }
    return range.test(version);
};
module.exports = satisfies;
}),
"[project]/Documents/GitHub/buenasv2/node_modules/semver/ranges/to-comparators.js [app-route] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

const Range = __turbopack_context__.r("[project]/Documents/GitHub/buenasv2/node_modules/semver/classes/range.js [app-route] (ecmascript)");
// Mostly just for testing and legacy API reasons
const toComparators = (range, options)=>new Range(range, options).set.map((comp)=>comp.map((c)=>c.value).join(' ').trim().split(' '));
module.exports = toComparators;
}),
"[project]/Documents/GitHub/buenasv2/node_modules/semver/ranges/max-satisfying.js [app-route] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

const SemVer = __turbopack_context__.r("[project]/Documents/GitHub/buenasv2/node_modules/semver/classes/semver.js [app-route] (ecmascript)");
const Range = __turbopack_context__.r("[project]/Documents/GitHub/buenasv2/node_modules/semver/classes/range.js [app-route] (ecmascript)");
const maxSatisfying = (versions, range, options)=>{
    let max = null;
    let maxSV = null;
    let rangeObj = null;
    try {
        rangeObj = new Range(range, options);
    } catch (er) {
        return null;
    }
    versions.forEach((v)=>{
        if (rangeObj.test(v)) {
            // satisfies(v, range, options)
            if (!max || maxSV.compare(v) === -1) {
                // compare(max, v, true)
                max = v;
                maxSV = new SemVer(max, options);
            }
        }
    });
    return max;
};
module.exports = maxSatisfying;
}),
"[project]/Documents/GitHub/buenasv2/node_modules/semver/ranges/min-satisfying.js [app-route] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

const SemVer = __turbopack_context__.r("[project]/Documents/GitHub/buenasv2/node_modules/semver/classes/semver.js [app-route] (ecmascript)");
const Range = __turbopack_context__.r("[project]/Documents/GitHub/buenasv2/node_modules/semver/classes/range.js [app-route] (ecmascript)");
const minSatisfying = (versions, range, options)=>{
    let min = null;
    let minSV = null;
    let rangeObj = null;
    try {
        rangeObj = new Range(range, options);
    } catch (er) {
        return null;
    }
    versions.forEach((v)=>{
        if (rangeObj.test(v)) {
            // satisfies(v, range, options)
            if (!min || minSV.compare(v) === 1) {
                // compare(min, v, true)
                min = v;
                minSV = new SemVer(min, options);
            }
        }
    });
    return min;
};
module.exports = minSatisfying;
}),
"[project]/Documents/GitHub/buenasv2/node_modules/semver/ranges/min-version.js [app-route] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

const SemVer = __turbopack_context__.r("[project]/Documents/GitHub/buenasv2/node_modules/semver/classes/semver.js [app-route] (ecmascript)");
const Range = __turbopack_context__.r("[project]/Documents/GitHub/buenasv2/node_modules/semver/classes/range.js [app-route] (ecmascript)");
const gt = __turbopack_context__.r("[project]/Documents/GitHub/buenasv2/node_modules/semver/functions/gt.js [app-route] (ecmascript)");
const minVersion = (range, loose)=>{
    range = new Range(range, loose);
    let minver = new SemVer('0.0.0');
    if (range.test(minver)) {
        return minver;
    }
    minver = new SemVer('0.0.0-0');
    if (range.test(minver)) {
        return minver;
    }
    minver = null;
    for(let i = 0; i < range.set.length; ++i){
        const comparators = range.set[i];
        let setMin = null;
        comparators.forEach((comparator)=>{
            // Clone to avoid manipulating the comparator's semver object.
            const compver = new SemVer(comparator.semver.version);
            switch(comparator.operator){
                case '>':
                    if (compver.prerelease.length === 0) {
                        compver.patch++;
                    } else {
                        compver.prerelease.push(0);
                    }
                    compver.raw = compver.format();
                /* fallthrough */ case '':
                case '>=':
                    if (!setMin || gt(compver, setMin)) {
                        setMin = compver;
                    }
                    break;
                case '<':
                case '<=':
                    break;
                /* istanbul ignore next */ default:
                    throw new Error(`Unexpected operation: ${comparator.operator}`);
            }
        });
        if (setMin && (!minver || gt(minver, setMin))) {
            minver = setMin;
        }
    }
    if (minver && range.test(minver)) {
        return minver;
    }
    return null;
};
module.exports = minVersion;
}),
"[project]/Documents/GitHub/buenasv2/node_modules/semver/ranges/valid.js [app-route] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

const Range = __turbopack_context__.r("[project]/Documents/GitHub/buenasv2/node_modules/semver/classes/range.js [app-route] (ecmascript)");
const validRange = (range, options)=>{
    try {
        // Return '*' instead of '' so that truthiness works.
        // This will throw if it's invalid anyway
        return new Range(range, options).range || '*';
    } catch (er) {
        return null;
    }
};
module.exports = validRange;
}),
"[project]/Documents/GitHub/buenasv2/node_modules/semver/ranges/outside.js [app-route] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

const SemVer = __turbopack_context__.r("[project]/Documents/GitHub/buenasv2/node_modules/semver/classes/semver.js [app-route] (ecmascript)");
const Comparator = __turbopack_context__.r("[project]/Documents/GitHub/buenasv2/node_modules/semver/classes/comparator.js [app-route] (ecmascript)");
const { ANY } = Comparator;
const Range = __turbopack_context__.r("[project]/Documents/GitHub/buenasv2/node_modules/semver/classes/range.js [app-route] (ecmascript)");
const satisfies = __turbopack_context__.r("[project]/Documents/GitHub/buenasv2/node_modules/semver/functions/satisfies.js [app-route] (ecmascript)");
const gt = __turbopack_context__.r("[project]/Documents/GitHub/buenasv2/node_modules/semver/functions/gt.js [app-route] (ecmascript)");
const lt = __turbopack_context__.r("[project]/Documents/GitHub/buenasv2/node_modules/semver/functions/lt.js [app-route] (ecmascript)");
const lte = __turbopack_context__.r("[project]/Documents/GitHub/buenasv2/node_modules/semver/functions/lte.js [app-route] (ecmascript)");
const gte = __turbopack_context__.r("[project]/Documents/GitHub/buenasv2/node_modules/semver/functions/gte.js [app-route] (ecmascript)");
const outside = (version, range, hilo, options)=>{
    version = new SemVer(version, options);
    range = new Range(range, options);
    let gtfn, ltefn, ltfn, comp, ecomp;
    switch(hilo){
        case '>':
            gtfn = gt;
            ltefn = lte;
            ltfn = lt;
            comp = '>';
            ecomp = '>=';
            break;
        case '<':
            gtfn = lt;
            ltefn = gte;
            ltfn = gt;
            comp = '<';
            ecomp = '<=';
            break;
        default:
            throw new TypeError('Must provide a hilo val of "<" or ">"');
    }
    // If it satisfies the range it is not outside
    if (satisfies(version, range, options)) {
        return false;
    }
    // From now on, variable terms are as if we're in "gtr" mode.
    // but note that everything is flipped for the "ltr" function.
    for(let i = 0; i < range.set.length; ++i){
        const comparators = range.set[i];
        let high = null;
        let low = null;
        comparators.forEach((comparator)=>{
            if (comparator.semver === ANY) {
                comparator = new Comparator('>=0.0.0');
            }
            high = high || comparator;
            low = low || comparator;
            if (gtfn(comparator.semver, high.semver, options)) {
                high = comparator;
            } else if (ltfn(comparator.semver, low.semver, options)) {
                low = comparator;
            }
        });
        // If the edge version comparator has a operator then our version
        // isn't outside it
        if (high.operator === comp || high.operator === ecomp) {
            return false;
        }
        // If the lowest version comparator has an operator and our version
        // is less than it then it isn't higher than the range
        if ((!low.operator || low.operator === comp) && ltefn(version, low.semver)) {
            return false;
        } else if (low.operator === ecomp && ltfn(version, low.semver)) {
            return false;
        }
    }
    return true;
};
module.exports = outside;
}),
"[project]/Documents/GitHub/buenasv2/node_modules/semver/ranges/gtr.js [app-route] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

// Determine if version is greater than all the versions possible in the range.
const outside = __turbopack_context__.r("[project]/Documents/GitHub/buenasv2/node_modules/semver/ranges/outside.js [app-route] (ecmascript)");
const gtr = (version, range, options)=>outside(version, range, '>', options);
module.exports = gtr;
}),
"[project]/Documents/GitHub/buenasv2/node_modules/semver/ranges/ltr.js [app-route] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

const outside = __turbopack_context__.r("[project]/Documents/GitHub/buenasv2/node_modules/semver/ranges/outside.js [app-route] (ecmascript)");
// Determine if version is less than all the versions possible in the range
const ltr = (version, range, options)=>outside(version, range, '<', options);
module.exports = ltr;
}),
"[project]/Documents/GitHub/buenasv2/node_modules/semver/ranges/intersects.js [app-route] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

const Range = __turbopack_context__.r("[project]/Documents/GitHub/buenasv2/node_modules/semver/classes/range.js [app-route] (ecmascript)");
const intersects = (r1, r2, options)=>{
    r1 = new Range(r1, options);
    r2 = new Range(r2, options);
    return r1.intersects(r2, options);
};
module.exports = intersects;
}),
"[project]/Documents/GitHub/buenasv2/node_modules/semver/ranges/simplify.js [app-route] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

// given a set of versions and a range, create a "simplified" range
// that includes the same versions that the original range does
// If the original range is shorter than the simplified one, return that.
const satisfies = __turbopack_context__.r("[project]/Documents/GitHub/buenasv2/node_modules/semver/functions/satisfies.js [app-route] (ecmascript)");
const compare = __turbopack_context__.r("[project]/Documents/GitHub/buenasv2/node_modules/semver/functions/compare.js [app-route] (ecmascript)");
module.exports = (versions, range, options)=>{
    const set = [];
    let first = null;
    let prev = null;
    const v = versions.sort((a, b)=>compare(a, b, options));
    for (const version of v){
        const included = satisfies(version, range, options);
        if (included) {
            prev = version;
            if (!first) {
                first = version;
            }
        } else {
            if (prev) {
                set.push([
                    first,
                    prev
                ]);
            }
            prev = null;
            first = null;
        }
    }
    if (first) {
        set.push([
            first,
            null
        ]);
    }
    const ranges = [];
    for (const [min, max] of set){
        if (min === max) {
            ranges.push(min);
        } else if (!max && min === v[0]) {
            ranges.push('*');
        } else if (!max) {
            ranges.push(`>=${min}`);
        } else if (min === v[0]) {
            ranges.push(`<=${max}`);
        } else {
            ranges.push(`${min} - ${max}`);
        }
    }
    const simplified = ranges.join(' || ');
    const original = typeof range.raw === 'string' ? range.raw : String(range);
    return simplified.length < original.length ? simplified : range;
};
}),
"[project]/Documents/GitHub/buenasv2/node_modules/semver/ranges/subset.js [app-route] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

const Range = __turbopack_context__.r("[project]/Documents/GitHub/buenasv2/node_modules/semver/classes/range.js [app-route] (ecmascript)");
const Comparator = __turbopack_context__.r("[project]/Documents/GitHub/buenasv2/node_modules/semver/classes/comparator.js [app-route] (ecmascript)");
const { ANY } = Comparator;
const satisfies = __turbopack_context__.r("[project]/Documents/GitHub/buenasv2/node_modules/semver/functions/satisfies.js [app-route] (ecmascript)");
const compare = __turbopack_context__.r("[project]/Documents/GitHub/buenasv2/node_modules/semver/functions/compare.js [app-route] (ecmascript)");
// Complex range `r1 || r2 || ...` is a subset of `R1 || R2 || ...` iff:
// - Every simple range `r1, r2, ...` is a null set, OR
// - Every simple range `r1, r2, ...` which is not a null set is a subset of
//   some `R1, R2, ...`
//
// Simple range `c1 c2 ...` is a subset of simple range `C1 C2 ...` iff:
// - If c is only the ANY comparator
//   - If C is only the ANY comparator, return true
//   - Else if in prerelease mode, return false
//   - else replace c with `[>=0.0.0]`
// - If C is only the ANY comparator
//   - if in prerelease mode, return true
//   - else replace C with `[>=0.0.0]`
// - Let EQ be the set of = comparators in c
// - If EQ is more than one, return true (null set)
// - Let GT be the highest > or >= comparator in c
// - Let LT be the lowest < or <= comparator in c
// - If GT and LT, and GT.semver > LT.semver, return true (null set)
// - If any C is a = range, and GT or LT are set, return false
// - If EQ
//   - If GT, and EQ does not satisfy GT, return true (null set)
//   - If LT, and EQ does not satisfy LT, return true (null set)
//   - If EQ satisfies every C, return true
//   - Else return false
// - If GT
//   - If GT.semver is lower than any > or >= comp in C, return false
//   - If GT is >=, and GT.semver does not satisfy every C, return false
//   - If GT.semver has a prerelease, and not in prerelease mode
//     - If no C has a prerelease and the GT.semver tuple, return false
// - If LT
//   - If LT.semver is greater than any < or <= comp in C, return false
//   - If LT is <=, and LT.semver does not satisfy every C, return false
//   - If GT.semver has a prerelease, and not in prerelease mode
//     - If no C has a prerelease and the LT.semver tuple, return false
// - Else return true
const subset = (sub, dom, options = {})=>{
    if (sub === dom) {
        return true;
    }
    sub = new Range(sub, options);
    dom = new Range(dom, options);
    let sawNonNull = false;
    OUTER: for (const simpleSub of sub.set){
        for (const simpleDom of dom.set){
            const isSub = simpleSubset(simpleSub, simpleDom, options);
            sawNonNull = sawNonNull || isSub !== null;
            if (isSub) {
                continue OUTER;
            }
        }
        // the null set is a subset of everything, but null simple ranges in
        // a complex range should be ignored.  so if we saw a non-null range,
        // then we know this isn't a subset, but if EVERY simple range was null,
        // then it is a subset.
        if (sawNonNull) {
            return false;
        }
    }
    return true;
};
const minimumVersionWithPreRelease = [
    new Comparator('>=0.0.0-0')
];
const minimumVersion = [
    new Comparator('>=0.0.0')
];
const simpleSubset = (sub, dom, options)=>{
    if (sub === dom) {
        return true;
    }
    if (sub.length === 1 && sub[0].semver === ANY) {
        if (dom.length === 1 && dom[0].semver === ANY) {
            return true;
        } else if (options.includePrerelease) {
            sub = minimumVersionWithPreRelease;
        } else {
            sub = minimumVersion;
        }
    }
    if (dom.length === 1 && dom[0].semver === ANY) {
        if (options.includePrerelease) {
            return true;
        } else {
            dom = minimumVersion;
        }
    }
    const eqSet = new Set();
    let gt, lt;
    for (const c of sub){
        if (c.operator === '>' || c.operator === '>=') {
            gt = higherGT(gt, c, options);
        } else if (c.operator === '<' || c.operator === '<=') {
            lt = lowerLT(lt, c, options);
        } else {
            eqSet.add(c.semver);
        }
    }
    if (eqSet.size > 1) {
        return null;
    }
    let gtltComp;
    if (gt && lt) {
        gtltComp = compare(gt.semver, lt.semver, options);
        if (gtltComp > 0) {
            return null;
        } else if (gtltComp === 0 && (gt.operator !== '>=' || lt.operator !== '<=')) {
            return null;
        }
    }
    // will iterate one or zero times
    for (const eq of eqSet){
        if (gt && !satisfies(eq, String(gt), options)) {
            return null;
        }
        if (lt && !satisfies(eq, String(lt), options)) {
            return null;
        }
        for (const c of dom){
            if (!satisfies(eq, String(c), options)) {
                return false;
            }
        }
        return true;
    }
    let higher, lower;
    let hasDomLT, hasDomGT;
    // if the subset has a prerelease, we need a comparator in the superset
    // with the same tuple and a prerelease, or it's not a subset
    let needDomLTPre = lt && !options.includePrerelease && lt.semver.prerelease.length ? lt.semver : false;
    let needDomGTPre = gt && !options.includePrerelease && gt.semver.prerelease.length ? gt.semver : false;
    // exception: <1.2.3-0 is the same as <1.2.3
    if (needDomLTPre && needDomLTPre.prerelease.length === 1 && lt.operator === '<' && needDomLTPre.prerelease[0] === 0) {
        needDomLTPre = false;
    }
    for (const c of dom){
        hasDomGT = hasDomGT || c.operator === '>' || c.operator === '>=';
        hasDomLT = hasDomLT || c.operator === '<' || c.operator === '<=';
        if (gt) {
            if (needDomGTPre) {
                if (c.semver.prerelease && c.semver.prerelease.length && c.semver.major === needDomGTPre.major && c.semver.minor === needDomGTPre.minor && c.semver.patch === needDomGTPre.patch) {
                    needDomGTPre = false;
                }
            }
            if (c.operator === '>' || c.operator === '>=') {
                higher = higherGT(gt, c, options);
                if (higher === c && higher !== gt) {
                    return false;
                }
            } else if (gt.operator === '>=' && !satisfies(gt.semver, String(c), options)) {
                return false;
            }
        }
        if (lt) {
            if (needDomLTPre) {
                if (c.semver.prerelease && c.semver.prerelease.length && c.semver.major === needDomLTPre.major && c.semver.minor === needDomLTPre.minor && c.semver.patch === needDomLTPre.patch) {
                    needDomLTPre = false;
                }
            }
            if (c.operator === '<' || c.operator === '<=') {
                lower = lowerLT(lt, c, options);
                if (lower === c && lower !== lt) {
                    return false;
                }
            } else if (lt.operator === '<=' && !satisfies(lt.semver, String(c), options)) {
                return false;
            }
        }
        if (!c.operator && (lt || gt) && gtltComp !== 0) {
            return false;
        }
    }
    // if there was a < or >, and nothing in the dom, then must be false
    // UNLESS it was limited by another range in the other direction.
    // Eg, >1.0.0 <1.0.1 is still a subset of <2.0.0
    if (gt && hasDomLT && !lt && gtltComp !== 0) {
        return false;
    }
    if (lt && hasDomGT && !gt && gtltComp !== 0) {
        return false;
    }
    // we needed a prerelease range in a specific tuple, but didn't get one
    // then this isn't a subset.  eg >=1.2.3-pre is not a subset of >=1.0.0,
    // because it includes prereleases in the 1.2.3 tuple
    if (needDomGTPre || needDomLTPre) {
        return false;
    }
    return true;
};
// >=1.2.3 is lower than >1.2.3
const higherGT = (a, b, options)=>{
    if (!a) {
        return b;
    }
    const comp = compare(a.semver, b.semver, options);
    return comp > 0 ? a : comp < 0 ? b : b.operator === '>' && a.operator === '>=' ? b : a;
};
// <=1.2.3 is higher than <1.2.3
const lowerLT = (a, b, options)=>{
    if (!a) {
        return b;
    }
    const comp = compare(a.semver, b.semver, options);
    return comp < 0 ? a : comp > 0 ? b : b.operator === '<' && a.operator === '<=' ? b : a;
};
module.exports = subset;
}),
"[project]/Documents/GitHub/buenasv2/node_modules/semver/index.js [app-route] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

// just pre-load all the stuff that index.js lazily exports
const internalRe = __turbopack_context__.r("[project]/Documents/GitHub/buenasv2/node_modules/semver/internal/re.js [app-route] (ecmascript)");
const constants = __turbopack_context__.r("[project]/Documents/GitHub/buenasv2/node_modules/semver/internal/constants.js [app-route] (ecmascript)");
const SemVer = __turbopack_context__.r("[project]/Documents/GitHub/buenasv2/node_modules/semver/classes/semver.js [app-route] (ecmascript)");
const identifiers = __turbopack_context__.r("[project]/Documents/GitHub/buenasv2/node_modules/semver/internal/identifiers.js [app-route] (ecmascript)");
const parse = __turbopack_context__.r("[project]/Documents/GitHub/buenasv2/node_modules/semver/functions/parse.js [app-route] (ecmascript)");
const valid = __turbopack_context__.r("[project]/Documents/GitHub/buenasv2/node_modules/semver/functions/valid.js [app-route] (ecmascript)");
const clean = __turbopack_context__.r("[project]/Documents/GitHub/buenasv2/node_modules/semver/functions/clean.js [app-route] (ecmascript)");
const inc = __turbopack_context__.r("[project]/Documents/GitHub/buenasv2/node_modules/semver/functions/inc.js [app-route] (ecmascript)");
const diff = __turbopack_context__.r("[project]/Documents/GitHub/buenasv2/node_modules/semver/functions/diff.js [app-route] (ecmascript)");
const major = __turbopack_context__.r("[project]/Documents/GitHub/buenasv2/node_modules/semver/functions/major.js [app-route] (ecmascript)");
const minor = __turbopack_context__.r("[project]/Documents/GitHub/buenasv2/node_modules/semver/functions/minor.js [app-route] (ecmascript)");
const patch = __turbopack_context__.r("[project]/Documents/GitHub/buenasv2/node_modules/semver/functions/patch.js [app-route] (ecmascript)");
const prerelease = __turbopack_context__.r("[project]/Documents/GitHub/buenasv2/node_modules/semver/functions/prerelease.js [app-route] (ecmascript)");
const compare = __turbopack_context__.r("[project]/Documents/GitHub/buenasv2/node_modules/semver/functions/compare.js [app-route] (ecmascript)");
const rcompare = __turbopack_context__.r("[project]/Documents/GitHub/buenasv2/node_modules/semver/functions/rcompare.js [app-route] (ecmascript)");
const compareLoose = __turbopack_context__.r("[project]/Documents/GitHub/buenasv2/node_modules/semver/functions/compare-loose.js [app-route] (ecmascript)");
const compareBuild = __turbopack_context__.r("[project]/Documents/GitHub/buenasv2/node_modules/semver/functions/compare-build.js [app-route] (ecmascript)");
const sort = __turbopack_context__.r("[project]/Documents/GitHub/buenasv2/node_modules/semver/functions/sort.js [app-route] (ecmascript)");
const rsort = __turbopack_context__.r("[project]/Documents/GitHub/buenasv2/node_modules/semver/functions/rsort.js [app-route] (ecmascript)");
const gt = __turbopack_context__.r("[project]/Documents/GitHub/buenasv2/node_modules/semver/functions/gt.js [app-route] (ecmascript)");
const lt = __turbopack_context__.r("[project]/Documents/GitHub/buenasv2/node_modules/semver/functions/lt.js [app-route] (ecmascript)");
const eq = __turbopack_context__.r("[project]/Documents/GitHub/buenasv2/node_modules/semver/functions/eq.js [app-route] (ecmascript)");
const neq = __turbopack_context__.r("[project]/Documents/GitHub/buenasv2/node_modules/semver/functions/neq.js [app-route] (ecmascript)");
const gte = __turbopack_context__.r("[project]/Documents/GitHub/buenasv2/node_modules/semver/functions/gte.js [app-route] (ecmascript)");
const lte = __turbopack_context__.r("[project]/Documents/GitHub/buenasv2/node_modules/semver/functions/lte.js [app-route] (ecmascript)");
const cmp = __turbopack_context__.r("[project]/Documents/GitHub/buenasv2/node_modules/semver/functions/cmp.js [app-route] (ecmascript)");
const coerce = __turbopack_context__.r("[project]/Documents/GitHub/buenasv2/node_modules/semver/functions/coerce.js [app-route] (ecmascript)");
const Comparator = __turbopack_context__.r("[project]/Documents/GitHub/buenasv2/node_modules/semver/classes/comparator.js [app-route] (ecmascript)");
const Range = __turbopack_context__.r("[project]/Documents/GitHub/buenasv2/node_modules/semver/classes/range.js [app-route] (ecmascript)");
const satisfies = __turbopack_context__.r("[project]/Documents/GitHub/buenasv2/node_modules/semver/functions/satisfies.js [app-route] (ecmascript)");
const toComparators = __turbopack_context__.r("[project]/Documents/GitHub/buenasv2/node_modules/semver/ranges/to-comparators.js [app-route] (ecmascript)");
const maxSatisfying = __turbopack_context__.r("[project]/Documents/GitHub/buenasv2/node_modules/semver/ranges/max-satisfying.js [app-route] (ecmascript)");
const minSatisfying = __turbopack_context__.r("[project]/Documents/GitHub/buenasv2/node_modules/semver/ranges/min-satisfying.js [app-route] (ecmascript)");
const minVersion = __turbopack_context__.r("[project]/Documents/GitHub/buenasv2/node_modules/semver/ranges/min-version.js [app-route] (ecmascript)");
const validRange = __turbopack_context__.r("[project]/Documents/GitHub/buenasv2/node_modules/semver/ranges/valid.js [app-route] (ecmascript)");
const outside = __turbopack_context__.r("[project]/Documents/GitHub/buenasv2/node_modules/semver/ranges/outside.js [app-route] (ecmascript)");
const gtr = __turbopack_context__.r("[project]/Documents/GitHub/buenasv2/node_modules/semver/ranges/gtr.js [app-route] (ecmascript)");
const ltr = __turbopack_context__.r("[project]/Documents/GitHub/buenasv2/node_modules/semver/ranges/ltr.js [app-route] (ecmascript)");
const intersects = __turbopack_context__.r("[project]/Documents/GitHub/buenasv2/node_modules/semver/ranges/intersects.js [app-route] (ecmascript)");
const simplifyRange = __turbopack_context__.r("[project]/Documents/GitHub/buenasv2/node_modules/semver/ranges/simplify.js [app-route] (ecmascript)");
const subset = __turbopack_context__.r("[project]/Documents/GitHub/buenasv2/node_modules/semver/ranges/subset.js [app-route] (ecmascript)");
module.exports = {
    parse,
    valid,
    clean,
    inc,
    diff,
    major,
    minor,
    patch,
    prerelease,
    compare,
    rcompare,
    compareLoose,
    compareBuild,
    sort,
    rsort,
    gt,
    lt,
    eq,
    neq,
    gte,
    lte,
    cmp,
    coerce,
    Comparator,
    Range,
    satisfies,
    toComparators,
    maxSatisfying,
    minSatisfying,
    minVersion,
    validRange,
    outside,
    gtr,
    ltr,
    intersects,
    simplifyRange,
    subset,
    SemVer,
    re: internalRe.re,
    src: internalRe.src,
    tokens: internalRe.t,
    SEMVER_SPEC_VERSION: constants.SEMVER_SPEC_VERSION,
    RELEASE_TYPES: constants.RELEASE_TYPES,
    compareIdentifiers: identifiers.compareIdentifiers,
    rcompareIdentifiers: identifiers.rcompareIdentifiers
};
}),
"[project]/Documents/GitHub/buenasv2/node_modules/jsonwebtoken/lib/asymmetricKeyDetailsSupported.js [app-route] (ecmascript)", ((__turbopack_context__, module, exports) => {

const semver = __turbopack_context__.r("[project]/Documents/GitHub/buenasv2/node_modules/semver/index.js [app-route] (ecmascript)");
module.exports = semver.satisfies(process.version, '>=15.7.0');
}),
"[project]/Documents/GitHub/buenasv2/node_modules/jsonwebtoken/lib/rsaPssKeyDetailsSupported.js [app-route] (ecmascript)", ((__turbopack_context__, module, exports) => {

const semver = __turbopack_context__.r("[project]/Documents/GitHub/buenasv2/node_modules/semver/index.js [app-route] (ecmascript)");
module.exports = semver.satisfies(process.version, '>=16.9.0');
}),
"[project]/Documents/GitHub/buenasv2/node_modules/jsonwebtoken/lib/validateAsymmetricKey.js [app-route] (ecmascript)", ((__turbopack_context__, module, exports) => {

const ASYMMETRIC_KEY_DETAILS_SUPPORTED = __turbopack_context__.r("[project]/Documents/GitHub/buenasv2/node_modules/jsonwebtoken/lib/asymmetricKeyDetailsSupported.js [app-route] (ecmascript)");
const RSA_PSS_KEY_DETAILS_SUPPORTED = __turbopack_context__.r("[project]/Documents/GitHub/buenasv2/node_modules/jsonwebtoken/lib/rsaPssKeyDetailsSupported.js [app-route] (ecmascript)");
const allowedAlgorithmsForKeys = {
    'ec': [
        'ES256',
        'ES384',
        'ES512'
    ],
    'rsa': [
        'RS256',
        'PS256',
        'RS384',
        'PS384',
        'RS512',
        'PS512'
    ],
    'rsa-pss': [
        'PS256',
        'PS384',
        'PS512'
    ]
};
const allowedCurves = {
    ES256: 'prime256v1',
    ES384: 'secp384r1',
    ES512: 'secp521r1'
};
module.exports = function(algorithm, key) {
    if (!algorithm || !key) return;
    const keyType = key.asymmetricKeyType;
    if (!keyType) return;
    const allowedAlgorithms = allowedAlgorithmsForKeys[keyType];
    if (!allowedAlgorithms) {
        throw new Error(`Unknown key type "${keyType}".`);
    }
    if (!allowedAlgorithms.includes(algorithm)) {
        throw new Error(`"alg" parameter for "${keyType}" key type must be one of: ${allowedAlgorithms.join(', ')}.`);
    }
    /*
   * Ignore the next block from test coverage because it gets executed
   * conditionally depending on the Node version. Not ignoring it would
   * prevent us from reaching the target % of coverage for versions of
   * Node under 15.7.0.
   */ /* istanbul ignore next */ if (ASYMMETRIC_KEY_DETAILS_SUPPORTED) {
        switch(keyType){
            case 'ec':
                const keyCurve = key.asymmetricKeyDetails.namedCurve;
                const allowedCurve = allowedCurves[algorithm];
                if (keyCurve !== allowedCurve) {
                    throw new Error(`"alg" parameter "${algorithm}" requires curve "${allowedCurve}".`);
                }
                break;
            case 'rsa-pss':
                if (RSA_PSS_KEY_DETAILS_SUPPORTED) {
                    const length = parseInt(algorithm.slice(-3), 10);
                    const { hashAlgorithm, mgf1HashAlgorithm, saltLength } = key.asymmetricKeyDetails;
                    if (hashAlgorithm !== `sha${length}` || mgf1HashAlgorithm !== hashAlgorithm) {
                        throw new Error(`Invalid key for this operation, its RSA-PSS parameters do not meet the requirements of "alg" ${algorithm}.`);
                    }
                    if (saltLength !== undefined && saltLength > length >> 3) {
                        throw new Error(`Invalid key for this operation, its RSA-PSS parameter saltLength does not meet the requirements of "alg" ${algorithm}.`);
                    }
                }
                break;
        }
    }
};
}),
"[project]/Documents/GitHub/buenasv2/node_modules/jsonwebtoken/lib/psSupported.js [app-route] (ecmascript)", ((__turbopack_context__, module, exports) => {

var semver = __turbopack_context__.r("[project]/Documents/GitHub/buenasv2/node_modules/semver/index.js [app-route] (ecmascript)");
module.exports = semver.satisfies(process.version, '^6.12.0 || >=8.0.0');
}),
"[project]/Documents/GitHub/buenasv2/node_modules/jsonwebtoken/verify.js [app-route] (ecmascript)", ((__turbopack_context__, module, exports) => {

const JsonWebTokenError = __turbopack_context__.r("[project]/Documents/GitHub/buenasv2/node_modules/jsonwebtoken/lib/JsonWebTokenError.js [app-route] (ecmascript)");
const NotBeforeError = __turbopack_context__.r("[project]/Documents/GitHub/buenasv2/node_modules/jsonwebtoken/lib/NotBeforeError.js [app-route] (ecmascript)");
const TokenExpiredError = __turbopack_context__.r("[project]/Documents/GitHub/buenasv2/node_modules/jsonwebtoken/lib/TokenExpiredError.js [app-route] (ecmascript)");
const decode = __turbopack_context__.r("[project]/Documents/GitHub/buenasv2/node_modules/jsonwebtoken/decode.js [app-route] (ecmascript)");
const timespan = __turbopack_context__.r("[project]/Documents/GitHub/buenasv2/node_modules/jsonwebtoken/lib/timespan.js [app-route] (ecmascript)");
const validateAsymmetricKey = __turbopack_context__.r("[project]/Documents/GitHub/buenasv2/node_modules/jsonwebtoken/lib/validateAsymmetricKey.js [app-route] (ecmascript)");
const PS_SUPPORTED = __turbopack_context__.r("[project]/Documents/GitHub/buenasv2/node_modules/jsonwebtoken/lib/psSupported.js [app-route] (ecmascript)");
const jws = __turbopack_context__.r("[project]/Documents/GitHub/buenasv2/node_modules/jws/index.js [app-route] (ecmascript)");
const { KeyObject, createSecretKey, createPublicKey } = __turbopack_context__.r("[externals]/crypto [external] (crypto, cjs)");
const PUB_KEY_ALGS = [
    'RS256',
    'RS384',
    'RS512'
];
const EC_KEY_ALGS = [
    'ES256',
    'ES384',
    'ES512'
];
const RSA_KEY_ALGS = [
    'RS256',
    'RS384',
    'RS512'
];
const HS_ALGS = [
    'HS256',
    'HS384',
    'HS512'
];
if (PS_SUPPORTED) {
    PUB_KEY_ALGS.splice(PUB_KEY_ALGS.length, 0, 'PS256', 'PS384', 'PS512');
    RSA_KEY_ALGS.splice(RSA_KEY_ALGS.length, 0, 'PS256', 'PS384', 'PS512');
}
module.exports = function(jwtString, secretOrPublicKey, options, callback) {
    if (typeof options === 'function' && !callback) {
        callback = options;
        options = {};
    }
    if (!options) {
        options = {};
    }
    //clone this object since we are going to mutate it.
    options = Object.assign({}, options);
    let done;
    if (callback) {
        done = callback;
    } else {
        done = function(err, data) {
            if (err) throw err;
            return data;
        };
    }
    if (options.clockTimestamp && typeof options.clockTimestamp !== 'number') {
        return done(new JsonWebTokenError('clockTimestamp must be a number'));
    }
    if (options.nonce !== undefined && (typeof options.nonce !== 'string' || options.nonce.trim() === '')) {
        return done(new JsonWebTokenError('nonce must be a non-empty string'));
    }
    if (options.allowInvalidAsymmetricKeyTypes !== undefined && typeof options.allowInvalidAsymmetricKeyTypes !== 'boolean') {
        return done(new JsonWebTokenError('allowInvalidAsymmetricKeyTypes must be a boolean'));
    }
    const clockTimestamp = options.clockTimestamp || Math.floor(Date.now() / 1000);
    if (!jwtString) {
        return done(new JsonWebTokenError('jwt must be provided'));
    }
    if (typeof jwtString !== 'string') {
        return done(new JsonWebTokenError('jwt must be a string'));
    }
    const parts = jwtString.split('.');
    if (parts.length !== 3) {
        return done(new JsonWebTokenError('jwt malformed'));
    }
    let decodedToken;
    try {
        decodedToken = decode(jwtString, {
            complete: true
        });
    } catch (err) {
        return done(err);
    }
    if (!decodedToken) {
        return done(new JsonWebTokenError('invalid token'));
    }
    const header = decodedToken.header;
    let getSecret;
    if (typeof secretOrPublicKey === 'function') {
        if (!callback) {
            return done(new JsonWebTokenError('verify must be called asynchronous if secret or public key is provided as a callback'));
        }
        getSecret = secretOrPublicKey;
    } else {
        getSecret = function(header, secretCallback) {
            return secretCallback(null, secretOrPublicKey);
        };
    }
    return getSecret(header, function(err, secretOrPublicKey) {
        if (err) {
            return done(new JsonWebTokenError('error in secret or public key callback: ' + err.message));
        }
        const hasSignature = parts[2].trim() !== '';
        if (!hasSignature && secretOrPublicKey) {
            return done(new JsonWebTokenError('jwt signature is required'));
        }
        if (hasSignature && !secretOrPublicKey) {
            return done(new JsonWebTokenError('secret or public key must be provided'));
        }
        if (!hasSignature && !options.algorithms) {
            return done(new JsonWebTokenError('please specify "none" in "algorithms" to verify unsigned tokens'));
        }
        if (secretOrPublicKey != null && !(secretOrPublicKey instanceof KeyObject)) {
            try {
                secretOrPublicKey = createPublicKey(secretOrPublicKey);
            } catch (_) {
                try {
                    secretOrPublicKey = createSecretKey(typeof secretOrPublicKey === 'string' ? Buffer.from(secretOrPublicKey) : secretOrPublicKey);
                } catch (_) {
                    return done(new JsonWebTokenError('secretOrPublicKey is not valid key material'));
                }
            }
        }
        if (!options.algorithms) {
            if (secretOrPublicKey.type === 'secret') {
                options.algorithms = HS_ALGS;
            } else if ([
                'rsa',
                'rsa-pss'
            ].includes(secretOrPublicKey.asymmetricKeyType)) {
                options.algorithms = RSA_KEY_ALGS;
            } else if (secretOrPublicKey.asymmetricKeyType === 'ec') {
                options.algorithms = EC_KEY_ALGS;
            } else {
                options.algorithms = PUB_KEY_ALGS;
            }
        }
        if (options.algorithms.indexOf(decodedToken.header.alg) === -1) {
            return done(new JsonWebTokenError('invalid algorithm'));
        }
        if (header.alg.startsWith('HS') && secretOrPublicKey.type !== 'secret') {
            return done(new JsonWebTokenError(`secretOrPublicKey must be a symmetric key when using ${header.alg}`));
        } else if (/^(?:RS|PS|ES)/.test(header.alg) && secretOrPublicKey.type !== 'public') {
            return done(new JsonWebTokenError(`secretOrPublicKey must be an asymmetric key when using ${header.alg}`));
        }
        if (!options.allowInvalidAsymmetricKeyTypes) {
            try {
                validateAsymmetricKey(header.alg, secretOrPublicKey);
            } catch (e) {
                return done(e);
            }
        }
        let valid;
        try {
            valid = jws.verify(jwtString, decodedToken.header.alg, secretOrPublicKey);
        } catch (e) {
            return done(e);
        }
        if (!valid) {
            return done(new JsonWebTokenError('invalid signature'));
        }
        const payload = decodedToken.payload;
        if (typeof payload.nbf !== 'undefined' && !options.ignoreNotBefore) {
            if (typeof payload.nbf !== 'number') {
                return done(new JsonWebTokenError('invalid nbf value'));
            }
            if (payload.nbf > clockTimestamp + (options.clockTolerance || 0)) {
                return done(new NotBeforeError('jwt not active', new Date(payload.nbf * 1000)));
            }
        }
        if (typeof payload.exp !== 'undefined' && !options.ignoreExpiration) {
            if (typeof payload.exp !== 'number') {
                return done(new JsonWebTokenError('invalid exp value'));
            }
            if (clockTimestamp >= payload.exp + (options.clockTolerance || 0)) {
                return done(new TokenExpiredError('jwt expired', new Date(payload.exp * 1000)));
            }
        }
        if (options.audience) {
            const audiences = Array.isArray(options.audience) ? options.audience : [
                options.audience
            ];
            const target = Array.isArray(payload.aud) ? payload.aud : [
                payload.aud
            ];
            const match = target.some(function(targetAudience) {
                return audiences.some(function(audience) {
                    return audience instanceof RegExp ? audience.test(targetAudience) : audience === targetAudience;
                });
            });
            if (!match) {
                return done(new JsonWebTokenError('jwt audience invalid. expected: ' + audiences.join(' or ')));
            }
        }
        if (options.issuer) {
            const invalid_issuer = typeof options.issuer === 'string' && payload.iss !== options.issuer || Array.isArray(options.issuer) && options.issuer.indexOf(payload.iss) === -1;
            if (invalid_issuer) {
                return done(new JsonWebTokenError('jwt issuer invalid. expected: ' + options.issuer));
            }
        }
        if (options.subject) {
            if (payload.sub !== options.subject) {
                return done(new JsonWebTokenError('jwt subject invalid. expected: ' + options.subject));
            }
        }
        if (options.jwtid) {
            if (payload.jti !== options.jwtid) {
                return done(new JsonWebTokenError('jwt jwtid invalid. expected: ' + options.jwtid));
            }
        }
        if (options.nonce) {
            if (payload.nonce !== options.nonce) {
                return done(new JsonWebTokenError('jwt nonce invalid. expected: ' + options.nonce));
            }
        }
        if (options.maxAge) {
            if (typeof payload.iat !== 'number') {
                return done(new JsonWebTokenError('iat required when maxAge is specified'));
            }
            const maxAgeTimestamp = timespan(options.maxAge, payload.iat);
            if (typeof maxAgeTimestamp === 'undefined') {
                return done(new JsonWebTokenError('"maxAge" should be a number of seconds or string representing a timespan eg: "1d", "20h", 60'));
            }
            if (clockTimestamp >= maxAgeTimestamp + (options.clockTolerance || 0)) {
                return done(new TokenExpiredError('maxAge exceeded', new Date(maxAgeTimestamp * 1000)));
            }
        }
        if (options.complete === true) {
            const signature = decodedToken.signature;
            return done(null, {
                header: header,
                payload: payload,
                signature: signature
            });
        }
        return done(null, payload);
    });
};
}),
"[project]/Documents/GitHub/buenasv2/node_modules/lodash.includes/index.js [app-route] (ecmascript)", ((__turbopack_context__, module, exports) => {

/**
 * lodash (Custom Build) <https://lodash.com/>
 * Build: `lodash modularize exports="npm" -o ./`
 * Copyright jQuery Foundation and other contributors <https://jquery.org/>
 * Released under MIT license <https://lodash.com/license>
 * Based on Underscore.js 1.8.3 <http://underscorejs.org/LICENSE>
 * Copyright Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
 */ /** Used as references for various `Number` constants. */ var INFINITY = 1 / 0, MAX_SAFE_INTEGER = 9007199254740991, MAX_INTEGER = 1.7976931348623157e+308, NAN = 0 / 0;
/** `Object#toString` result references. */ var argsTag = '[object Arguments]', funcTag = '[object Function]', genTag = '[object GeneratorFunction]', stringTag = '[object String]', symbolTag = '[object Symbol]';
/** Used to match leading and trailing whitespace. */ var reTrim = /^\s+|\s+$/g;
/** Used to detect bad signed hexadecimal string values. */ var reIsBadHex = /^[-+]0x[0-9a-f]+$/i;
/** Used to detect binary string values. */ var reIsBinary = /^0b[01]+$/i;
/** Used to detect octal string values. */ var reIsOctal = /^0o[0-7]+$/i;
/** Used to detect unsigned integer values. */ var reIsUint = /^(?:0|[1-9]\d*)$/;
/** Built-in method references without a dependency on `root`. */ var freeParseInt = parseInt;
/**
 * A specialized version of `_.map` for arrays without support for iteratee
 * shorthands.
 *
 * @private
 * @param {Array} [array] The array to iterate over.
 * @param {Function} iteratee The function invoked per iteration.
 * @returns {Array} Returns the new mapped array.
 */ function arrayMap(array, iteratee) {
    var index = -1, length = array ? array.length : 0, result = Array(length);
    while(++index < length){
        result[index] = iteratee(array[index], index, array);
    }
    return result;
}
/**
 * The base implementation of `_.findIndex` and `_.findLastIndex` without
 * support for iteratee shorthands.
 *
 * @private
 * @param {Array} array The array to inspect.
 * @param {Function} predicate The function invoked per iteration.
 * @param {number} fromIndex The index to search from.
 * @param {boolean} [fromRight] Specify iterating from right to left.
 * @returns {number} Returns the index of the matched value, else `-1`.
 */ function baseFindIndex(array, predicate, fromIndex, fromRight) {
    var length = array.length, index = fromIndex + (fromRight ? 1 : -1);
    while(fromRight ? index-- : ++index < length){
        if (predicate(array[index], index, array)) {
            return index;
        }
    }
    return -1;
}
/**
 * The base implementation of `_.indexOf` without `fromIndex` bounds checks.
 *
 * @private
 * @param {Array} array The array to inspect.
 * @param {*} value The value to search for.
 * @param {number} fromIndex The index to search from.
 * @returns {number} Returns the index of the matched value, else `-1`.
 */ function baseIndexOf(array, value, fromIndex) {
    if (value !== value) {
        return baseFindIndex(array, baseIsNaN, fromIndex);
    }
    var index = fromIndex - 1, length = array.length;
    while(++index < length){
        if (array[index] === value) {
            return index;
        }
    }
    return -1;
}
/**
 * The base implementation of `_.isNaN` without support for number objects.
 *
 * @private
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is `NaN`, else `false`.
 */ function baseIsNaN(value) {
    return value !== value;
}
/**
 * The base implementation of `_.times` without support for iteratee shorthands
 * or max array length checks.
 *
 * @private
 * @param {number} n The number of times to invoke `iteratee`.
 * @param {Function} iteratee The function invoked per iteration.
 * @returns {Array} Returns the array of results.
 */ function baseTimes(n, iteratee) {
    var index = -1, result = Array(n);
    while(++index < n){
        result[index] = iteratee(index);
    }
    return result;
}
/**
 * The base implementation of `_.values` and `_.valuesIn` which creates an
 * array of `object` property values corresponding to the property names
 * of `props`.
 *
 * @private
 * @param {Object} object The object to query.
 * @param {Array} props The property names to get values for.
 * @returns {Object} Returns the array of property values.
 */ function baseValues(object, props) {
    return arrayMap(props, function(key) {
        return object[key];
    });
}
/**
 * Creates a unary function that invokes `func` with its argument transformed.
 *
 * @private
 * @param {Function} func The function to wrap.
 * @param {Function} transform The argument transform.
 * @returns {Function} Returns the new function.
 */ function overArg(func, transform) {
    return function(arg) {
        return func(transform(arg));
    };
}
/** Used for built-in method references. */ var objectProto = Object.prototype;
/** Used to check objects for own properties. */ var hasOwnProperty = objectProto.hasOwnProperty;
/**
 * Used to resolve the
 * [`toStringTag`](http://ecma-international.org/ecma-262/7.0/#sec-object.prototype.tostring)
 * of values.
 */ var objectToString = objectProto.toString;
/** Built-in value references. */ var propertyIsEnumerable = objectProto.propertyIsEnumerable;
/* Built-in method references for those with the same name as other `lodash` methods. */ var nativeKeys = overArg(Object.keys, Object), nativeMax = Math.max;
/**
 * Creates an array of the enumerable property names of the array-like `value`.
 *
 * @private
 * @param {*} value The value to query.
 * @param {boolean} inherited Specify returning inherited property names.
 * @returns {Array} Returns the array of property names.
 */ function arrayLikeKeys(value, inherited) {
    // Safari 8.1 makes `arguments.callee` enumerable in strict mode.
    // Safari 9 makes `arguments.length` enumerable in strict mode.
    var result = isArray(value) || isArguments(value) ? baseTimes(value.length, String) : [];
    var length = result.length, skipIndexes = !!length;
    for(var key in value){
        if ((inherited || hasOwnProperty.call(value, key)) && !(skipIndexes && (key == 'length' || isIndex(key, length)))) {
            result.push(key);
        }
    }
    return result;
}
/**
 * The base implementation of `_.keys` which doesn't treat sparse arrays as dense.
 *
 * @private
 * @param {Object} object The object to query.
 * @returns {Array} Returns the array of property names.
 */ function baseKeys(object) {
    if (!isPrototype(object)) {
        return nativeKeys(object);
    }
    var result = [];
    for(var key in Object(object)){
        if (hasOwnProperty.call(object, key) && key != 'constructor') {
            result.push(key);
        }
    }
    return result;
}
/**
 * Checks if `value` is a valid array-like index.
 *
 * @private
 * @param {*} value The value to check.
 * @param {number} [length=MAX_SAFE_INTEGER] The upper bounds of a valid index.
 * @returns {boolean} Returns `true` if `value` is a valid index, else `false`.
 */ function isIndex(value, length) {
    length = length == null ? MAX_SAFE_INTEGER : length;
    return !!length && (typeof value == 'number' || reIsUint.test(value)) && value > -1 && value % 1 == 0 && value < length;
}
/**
 * Checks if `value` is likely a prototype object.
 *
 * @private
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a prototype, else `false`.
 */ function isPrototype(value) {
    var Ctor = value && value.constructor, proto = typeof Ctor == 'function' && Ctor.prototype || objectProto;
    return value === proto;
}
/**
 * Checks if `value` is in `collection`. If `collection` is a string, it's
 * checked for a substring of `value`, otherwise
 * [`SameValueZero`](http://ecma-international.org/ecma-262/7.0/#sec-samevaluezero)
 * is used for equality comparisons. If `fromIndex` is negative, it's used as
 * the offset from the end of `collection`.
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @category Collection
 * @param {Array|Object|string} collection The collection to inspect.
 * @param {*} value The value to search for.
 * @param {number} [fromIndex=0] The index to search from.
 * @param- {Object} [guard] Enables use as an iteratee for methods like `_.reduce`.
 * @returns {boolean} Returns `true` if `value` is found, else `false`.
 * @example
 *
 * _.includes([1, 2, 3], 1);
 * // => true
 *
 * _.includes([1, 2, 3], 1, 2);
 * // => false
 *
 * _.includes({ 'a': 1, 'b': 2 }, 1);
 * // => true
 *
 * _.includes('abcd', 'bc');
 * // => true
 */ function includes(collection, value, fromIndex, guard) {
    collection = isArrayLike(collection) ? collection : values(collection);
    fromIndex = fromIndex && !guard ? toInteger(fromIndex) : 0;
    var length = collection.length;
    if (fromIndex < 0) {
        fromIndex = nativeMax(length + fromIndex, 0);
    }
    return isString(collection) ? fromIndex <= length && collection.indexOf(value, fromIndex) > -1 : !!length && baseIndexOf(collection, value, fromIndex) > -1;
}
/**
 * Checks if `value` is likely an `arguments` object.
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is an `arguments` object,
 *  else `false`.
 * @example
 *
 * _.isArguments(function() { return arguments; }());
 * // => true
 *
 * _.isArguments([1, 2, 3]);
 * // => false
 */ function isArguments(value) {
    // Safari 8.1 makes `arguments.callee` enumerable in strict mode.
    return isArrayLikeObject(value) && hasOwnProperty.call(value, 'callee') && (!propertyIsEnumerable.call(value, 'callee') || objectToString.call(value) == argsTag);
}
/**
 * Checks if `value` is classified as an `Array` object.
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is an array, else `false`.
 * @example
 *
 * _.isArray([1, 2, 3]);
 * // => true
 *
 * _.isArray(document.body.children);
 * // => false
 *
 * _.isArray('abc');
 * // => false
 *
 * _.isArray(_.noop);
 * // => false
 */ var isArray = Array.isArray;
/**
 * Checks if `value` is array-like. A value is considered array-like if it's
 * not a function and has a `value.length` that's an integer greater than or
 * equal to `0` and less than or equal to `Number.MAX_SAFE_INTEGER`.
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is array-like, else `false`.
 * @example
 *
 * _.isArrayLike([1, 2, 3]);
 * // => true
 *
 * _.isArrayLike(document.body.children);
 * // => true
 *
 * _.isArrayLike('abc');
 * // => true
 *
 * _.isArrayLike(_.noop);
 * // => false
 */ function isArrayLike(value) {
    return value != null && isLength(value.length) && !isFunction(value);
}
/**
 * This method is like `_.isArrayLike` except that it also checks if `value`
 * is an object.
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is an array-like object,
 *  else `false`.
 * @example
 *
 * _.isArrayLikeObject([1, 2, 3]);
 * // => true
 *
 * _.isArrayLikeObject(document.body.children);
 * // => true
 *
 * _.isArrayLikeObject('abc');
 * // => false
 *
 * _.isArrayLikeObject(_.noop);
 * // => false
 */ function isArrayLikeObject(value) {
    return isObjectLike(value) && isArrayLike(value);
}
/**
 * Checks if `value` is classified as a `Function` object.
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a function, else `false`.
 * @example
 *
 * _.isFunction(_);
 * // => true
 *
 * _.isFunction(/abc/);
 * // => false
 */ function isFunction(value) {
    // The use of `Object#toString` avoids issues with the `typeof` operator
    // in Safari 8-9 which returns 'object' for typed array and other constructors.
    var tag = isObject(value) ? objectToString.call(value) : '';
    return tag == funcTag || tag == genTag;
}
/**
 * Checks if `value` is a valid array-like length.
 *
 * **Note:** This method is loosely based on
 * [`ToLength`](http://ecma-international.org/ecma-262/7.0/#sec-tolength).
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a valid length, else `false`.
 * @example
 *
 * _.isLength(3);
 * // => true
 *
 * _.isLength(Number.MIN_VALUE);
 * // => false
 *
 * _.isLength(Infinity);
 * // => false
 *
 * _.isLength('3');
 * // => false
 */ function isLength(value) {
    return typeof value == 'number' && value > -1 && value % 1 == 0 && value <= MAX_SAFE_INTEGER;
}
/**
 * Checks if `value` is the
 * [language type](http://www.ecma-international.org/ecma-262/7.0/#sec-ecmascript-language-types)
 * of `Object`. (e.g. arrays, functions, objects, regexes, `new Number(0)`, and `new String('')`)
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is an object, else `false`.
 * @example
 *
 * _.isObject({});
 * // => true
 *
 * _.isObject([1, 2, 3]);
 * // => true
 *
 * _.isObject(_.noop);
 * // => true
 *
 * _.isObject(null);
 * // => false
 */ function isObject(value) {
    var type = typeof value;
    return !!value && (type == 'object' || type == 'function');
}
/**
 * Checks if `value` is object-like. A value is object-like if it's not `null`
 * and has a `typeof` result of "object".
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is object-like, else `false`.
 * @example
 *
 * _.isObjectLike({});
 * // => true
 *
 * _.isObjectLike([1, 2, 3]);
 * // => true
 *
 * _.isObjectLike(_.noop);
 * // => false
 *
 * _.isObjectLike(null);
 * // => false
 */ function isObjectLike(value) {
    return !!value && typeof value == 'object';
}
/**
 * Checks if `value` is classified as a `String` primitive or object.
 *
 * @static
 * @since 0.1.0
 * @memberOf _
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a string, else `false`.
 * @example
 *
 * _.isString('abc');
 * // => true
 *
 * _.isString(1);
 * // => false
 */ function isString(value) {
    return typeof value == 'string' || !isArray(value) && isObjectLike(value) && objectToString.call(value) == stringTag;
}
/**
 * Checks if `value` is classified as a `Symbol` primitive or object.
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a symbol, else `false`.
 * @example
 *
 * _.isSymbol(Symbol.iterator);
 * // => true
 *
 * _.isSymbol('abc');
 * // => false
 */ function isSymbol(value) {
    return typeof value == 'symbol' || isObjectLike(value) && objectToString.call(value) == symbolTag;
}
/**
 * Converts `value` to a finite number.
 *
 * @static
 * @memberOf _
 * @since 4.12.0
 * @category Lang
 * @param {*} value The value to convert.
 * @returns {number} Returns the converted number.
 * @example
 *
 * _.toFinite(3.2);
 * // => 3.2
 *
 * _.toFinite(Number.MIN_VALUE);
 * // => 5e-324
 *
 * _.toFinite(Infinity);
 * // => 1.7976931348623157e+308
 *
 * _.toFinite('3.2');
 * // => 3.2
 */ function toFinite(value) {
    if (!value) {
        return value === 0 ? value : 0;
    }
    value = toNumber(value);
    if (value === INFINITY || value === -INFINITY) {
        var sign = value < 0 ? -1 : 1;
        return sign * MAX_INTEGER;
    }
    return value === value ? value : 0;
}
/**
 * Converts `value` to an integer.
 *
 * **Note:** This method is loosely based on
 * [`ToInteger`](http://www.ecma-international.org/ecma-262/7.0/#sec-tointeger).
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to convert.
 * @returns {number} Returns the converted integer.
 * @example
 *
 * _.toInteger(3.2);
 * // => 3
 *
 * _.toInteger(Number.MIN_VALUE);
 * // => 0
 *
 * _.toInteger(Infinity);
 * // => 1.7976931348623157e+308
 *
 * _.toInteger('3.2');
 * // => 3
 */ function toInteger(value) {
    var result = toFinite(value), remainder = result % 1;
    return result === result ? remainder ? result - remainder : result : 0;
}
/**
 * Converts `value` to a number.
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to process.
 * @returns {number} Returns the number.
 * @example
 *
 * _.toNumber(3.2);
 * // => 3.2
 *
 * _.toNumber(Number.MIN_VALUE);
 * // => 5e-324
 *
 * _.toNumber(Infinity);
 * // => Infinity
 *
 * _.toNumber('3.2');
 * // => 3.2
 */ function toNumber(value) {
    if (typeof value == 'number') {
        return value;
    }
    if (isSymbol(value)) {
        return NAN;
    }
    if (isObject(value)) {
        var other = typeof value.valueOf == 'function' ? value.valueOf() : value;
        value = isObject(other) ? other + '' : other;
    }
    if (typeof value != 'string') {
        return value === 0 ? value : +value;
    }
    value = value.replace(reTrim, '');
    var isBinary = reIsBinary.test(value);
    return isBinary || reIsOctal.test(value) ? freeParseInt(value.slice(2), isBinary ? 2 : 8) : reIsBadHex.test(value) ? NAN : +value;
}
/**
 * Creates an array of the own enumerable property names of `object`.
 *
 * **Note:** Non-object values are coerced to objects. See the
 * [ES spec](http://ecma-international.org/ecma-262/7.0/#sec-object.keys)
 * for more details.
 *
 * @static
 * @since 0.1.0
 * @memberOf _
 * @category Object
 * @param {Object} object The object to query.
 * @returns {Array} Returns the array of property names.
 * @example
 *
 * function Foo() {
 *   this.a = 1;
 *   this.b = 2;
 * }
 *
 * Foo.prototype.c = 3;
 *
 * _.keys(new Foo);
 * // => ['a', 'b'] (iteration order is not guaranteed)
 *
 * _.keys('hi');
 * // => ['0', '1']
 */ function keys(object) {
    return isArrayLike(object) ? arrayLikeKeys(object) : baseKeys(object);
}
/**
 * Creates an array of the own enumerable string keyed property values of `object`.
 *
 * **Note:** Non-object values are coerced to objects.
 *
 * @static
 * @since 0.1.0
 * @memberOf _
 * @category Object
 * @param {Object} object The object to query.
 * @returns {Array} Returns the array of property values.
 * @example
 *
 * function Foo() {
 *   this.a = 1;
 *   this.b = 2;
 * }
 *
 * Foo.prototype.c = 3;
 *
 * _.values(new Foo);
 * // => [1, 2] (iteration order is not guaranteed)
 *
 * _.values('hi');
 * // => ['h', 'i']
 */ function values(object) {
    return object ? baseValues(object, keys(object)) : [];
}
module.exports = includes;
}),
"[project]/Documents/GitHub/buenasv2/node_modules/lodash.isboolean/index.js [app-route] (ecmascript)", ((__turbopack_context__, module, exports) => {

/**
 * lodash 3.0.3 (Custom Build) <https://lodash.com/>
 * Build: `lodash modularize exports="npm" -o ./`
 * Copyright 2012-2016 The Dojo Foundation <http://dojofoundation.org/>
 * Based on Underscore.js 1.8.3 <http://underscorejs.org/LICENSE>
 * Copyright 2009-2016 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
 * Available under MIT license <https://lodash.com/license>
 */ /** `Object#toString` result references. */ var boolTag = '[object Boolean]';
/** Used for built-in method references. */ var objectProto = Object.prototype;
/**
 * Used to resolve the [`toStringTag`](http://ecma-international.org/ecma-262/6.0/#sec-object.prototype.tostring)
 * of values.
 */ var objectToString = objectProto.toString;
/**
 * Checks if `value` is classified as a boolean primitive or object.
 *
 * @static
 * @memberOf _
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is correctly classified, else `false`.
 * @example
 *
 * _.isBoolean(false);
 * // => true
 *
 * _.isBoolean(null);
 * // => false
 */ function isBoolean(value) {
    return value === true || value === false || isObjectLike(value) && objectToString.call(value) == boolTag;
}
/**
 * Checks if `value` is object-like. A value is object-like if it's not `null`
 * and has a `typeof` result of "object".
 *
 * @static
 * @memberOf _
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is object-like, else `false`.
 * @example
 *
 * _.isObjectLike({});
 * // => true
 *
 * _.isObjectLike([1, 2, 3]);
 * // => true
 *
 * _.isObjectLike(_.noop);
 * // => false
 *
 * _.isObjectLike(null);
 * // => false
 */ function isObjectLike(value) {
    return !!value && typeof value == 'object';
}
module.exports = isBoolean;
}),
"[project]/Documents/GitHub/buenasv2/node_modules/lodash.isinteger/index.js [app-route] (ecmascript)", ((__turbopack_context__, module, exports) => {

/**
 * lodash (Custom Build) <https://lodash.com/>
 * Build: `lodash modularize exports="npm" -o ./`
 * Copyright jQuery Foundation and other contributors <https://jquery.org/>
 * Released under MIT license <https://lodash.com/license>
 * Based on Underscore.js 1.8.3 <http://underscorejs.org/LICENSE>
 * Copyright Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
 */ /** Used as references for various `Number` constants. */ var INFINITY = 1 / 0, MAX_INTEGER = 1.7976931348623157e+308, NAN = 0 / 0;
/** `Object#toString` result references. */ var symbolTag = '[object Symbol]';
/** Used to match leading and trailing whitespace. */ var reTrim = /^\s+|\s+$/g;
/** Used to detect bad signed hexadecimal string values. */ var reIsBadHex = /^[-+]0x[0-9a-f]+$/i;
/** Used to detect binary string values. */ var reIsBinary = /^0b[01]+$/i;
/** Used to detect octal string values. */ var reIsOctal = /^0o[0-7]+$/i;
/** Built-in method references without a dependency on `root`. */ var freeParseInt = parseInt;
/** Used for built-in method references. */ var objectProto = Object.prototype;
/**
 * Used to resolve the
 * [`toStringTag`](http://ecma-international.org/ecma-262/7.0/#sec-object.prototype.tostring)
 * of values.
 */ var objectToString = objectProto.toString;
/**
 * Checks if `value` is an integer.
 *
 * **Note:** This method is based on
 * [`Number.isInteger`](https://mdn.io/Number/isInteger).
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is an integer, else `false`.
 * @example
 *
 * _.isInteger(3);
 * // => true
 *
 * _.isInteger(Number.MIN_VALUE);
 * // => false
 *
 * _.isInteger(Infinity);
 * // => false
 *
 * _.isInteger('3');
 * // => false
 */ function isInteger(value) {
    return typeof value == 'number' && value == toInteger(value);
}
/**
 * Checks if `value` is the
 * [language type](http://www.ecma-international.org/ecma-262/7.0/#sec-ecmascript-language-types)
 * of `Object`. (e.g. arrays, functions, objects, regexes, `new Number(0)`, and `new String('')`)
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is an object, else `false`.
 * @example
 *
 * _.isObject({});
 * // => true
 *
 * _.isObject([1, 2, 3]);
 * // => true
 *
 * _.isObject(_.noop);
 * // => true
 *
 * _.isObject(null);
 * // => false
 */ function isObject(value) {
    var type = typeof value;
    return !!value && (type == 'object' || type == 'function');
}
/**
 * Checks if `value` is object-like. A value is object-like if it's not `null`
 * and has a `typeof` result of "object".
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is object-like, else `false`.
 * @example
 *
 * _.isObjectLike({});
 * // => true
 *
 * _.isObjectLike([1, 2, 3]);
 * // => true
 *
 * _.isObjectLike(_.noop);
 * // => false
 *
 * _.isObjectLike(null);
 * // => false
 */ function isObjectLike(value) {
    return !!value && typeof value == 'object';
}
/**
 * Checks if `value` is classified as a `Symbol` primitive or object.
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a symbol, else `false`.
 * @example
 *
 * _.isSymbol(Symbol.iterator);
 * // => true
 *
 * _.isSymbol('abc');
 * // => false
 */ function isSymbol(value) {
    return typeof value == 'symbol' || isObjectLike(value) && objectToString.call(value) == symbolTag;
}
/**
 * Converts `value` to a finite number.
 *
 * @static
 * @memberOf _
 * @since 4.12.0
 * @category Lang
 * @param {*} value The value to convert.
 * @returns {number} Returns the converted number.
 * @example
 *
 * _.toFinite(3.2);
 * // => 3.2
 *
 * _.toFinite(Number.MIN_VALUE);
 * // => 5e-324
 *
 * _.toFinite(Infinity);
 * // => 1.7976931348623157e+308
 *
 * _.toFinite('3.2');
 * // => 3.2
 */ function toFinite(value) {
    if (!value) {
        return value === 0 ? value : 0;
    }
    value = toNumber(value);
    if (value === INFINITY || value === -INFINITY) {
        var sign = value < 0 ? -1 : 1;
        return sign * MAX_INTEGER;
    }
    return value === value ? value : 0;
}
/**
 * Converts `value` to an integer.
 *
 * **Note:** This method is loosely based on
 * [`ToInteger`](http://www.ecma-international.org/ecma-262/7.0/#sec-tointeger).
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to convert.
 * @returns {number} Returns the converted integer.
 * @example
 *
 * _.toInteger(3.2);
 * // => 3
 *
 * _.toInteger(Number.MIN_VALUE);
 * // => 0
 *
 * _.toInteger(Infinity);
 * // => 1.7976931348623157e+308
 *
 * _.toInteger('3.2');
 * // => 3
 */ function toInteger(value) {
    var result = toFinite(value), remainder = result % 1;
    return result === result ? remainder ? result - remainder : result : 0;
}
/**
 * Converts `value` to a number.
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to process.
 * @returns {number} Returns the number.
 * @example
 *
 * _.toNumber(3.2);
 * // => 3.2
 *
 * _.toNumber(Number.MIN_VALUE);
 * // => 5e-324
 *
 * _.toNumber(Infinity);
 * // => Infinity
 *
 * _.toNumber('3.2');
 * // => 3.2
 */ function toNumber(value) {
    if (typeof value == 'number') {
        return value;
    }
    if (isSymbol(value)) {
        return NAN;
    }
    if (isObject(value)) {
        var other = typeof value.valueOf == 'function' ? value.valueOf() : value;
        value = isObject(other) ? other + '' : other;
    }
    if (typeof value != 'string') {
        return value === 0 ? value : +value;
    }
    value = value.replace(reTrim, '');
    var isBinary = reIsBinary.test(value);
    return isBinary || reIsOctal.test(value) ? freeParseInt(value.slice(2), isBinary ? 2 : 8) : reIsBadHex.test(value) ? NAN : +value;
}
module.exports = isInteger;
}),
"[project]/Documents/GitHub/buenasv2/node_modules/lodash.isnumber/index.js [app-route] (ecmascript)", ((__turbopack_context__, module, exports) => {

/**
 * lodash 3.0.3 (Custom Build) <https://lodash.com/>
 * Build: `lodash modularize exports="npm" -o ./`
 * Copyright 2012-2016 The Dojo Foundation <http://dojofoundation.org/>
 * Based on Underscore.js 1.8.3 <http://underscorejs.org/LICENSE>
 * Copyright 2009-2016 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
 * Available under MIT license <https://lodash.com/license>
 */ /** `Object#toString` result references. */ var numberTag = '[object Number]';
/** Used for built-in method references. */ var objectProto = Object.prototype;
/**
 * Used to resolve the [`toStringTag`](http://ecma-international.org/ecma-262/6.0/#sec-object.prototype.tostring)
 * of values.
 */ var objectToString = objectProto.toString;
/**
 * Checks if `value` is object-like. A value is object-like if it's not `null`
 * and has a `typeof` result of "object".
 *
 * @static
 * @memberOf _
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is object-like, else `false`.
 * @example
 *
 * _.isObjectLike({});
 * // => true
 *
 * _.isObjectLike([1, 2, 3]);
 * // => true
 *
 * _.isObjectLike(_.noop);
 * // => false
 *
 * _.isObjectLike(null);
 * // => false
 */ function isObjectLike(value) {
    return !!value && typeof value == 'object';
}
/**
 * Checks if `value` is classified as a `Number` primitive or object.
 *
 * **Note:** To exclude `Infinity`, `-Infinity`, and `NaN`, which are classified
 * as numbers, use the `_.isFinite` method.
 *
 * @static
 * @memberOf _
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is correctly classified, else `false`.
 * @example
 *
 * _.isNumber(3);
 * // => true
 *
 * _.isNumber(Number.MIN_VALUE);
 * // => true
 *
 * _.isNumber(Infinity);
 * // => true
 *
 * _.isNumber('3');
 * // => false
 */ function isNumber(value) {
    return typeof value == 'number' || isObjectLike(value) && objectToString.call(value) == numberTag;
}
module.exports = isNumber;
}),
"[project]/Documents/GitHub/buenasv2/node_modules/lodash.isplainobject/index.js [app-route] (ecmascript)", ((__turbopack_context__, module, exports) => {

/**
 * lodash (Custom Build) <https://lodash.com/>
 * Build: `lodash modularize exports="npm" -o ./`
 * Copyright jQuery Foundation and other contributors <https://jquery.org/>
 * Released under MIT license <https://lodash.com/license>
 * Based on Underscore.js 1.8.3 <http://underscorejs.org/LICENSE>
 * Copyright Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
 */ /** `Object#toString` result references. */ var objectTag = '[object Object]';
/**
 * Checks if `value` is a host object in IE < 9.
 *
 * @private
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a host object, else `false`.
 */ function isHostObject(value) {
    // Many host objects are `Object` objects that can coerce to strings
    // despite having improperly defined `toString` methods.
    var result = false;
    if (value != null && typeof value.toString != 'function') {
        try {
            result = !!(value + '');
        } catch (e) {}
    }
    return result;
}
/**
 * Creates a unary function that invokes `func` with its argument transformed.
 *
 * @private
 * @param {Function} func The function to wrap.
 * @param {Function} transform The argument transform.
 * @returns {Function} Returns the new function.
 */ function overArg(func, transform) {
    return function(arg) {
        return func(transform(arg));
    };
}
/** Used for built-in method references. */ var funcProto = Function.prototype, objectProto = Object.prototype;
/** Used to resolve the decompiled source of functions. */ var funcToString = funcProto.toString;
/** Used to check objects for own properties. */ var hasOwnProperty = objectProto.hasOwnProperty;
/** Used to infer the `Object` constructor. */ var objectCtorString = funcToString.call(Object);
/**
 * Used to resolve the
 * [`toStringTag`](http://ecma-international.org/ecma-262/7.0/#sec-object.prototype.tostring)
 * of values.
 */ var objectToString = objectProto.toString;
/** Built-in value references. */ var getPrototype = overArg(Object.getPrototypeOf, Object);
/**
 * Checks if `value` is object-like. A value is object-like if it's not `null`
 * and has a `typeof` result of "object".
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is object-like, else `false`.
 * @example
 *
 * _.isObjectLike({});
 * // => true
 *
 * _.isObjectLike([1, 2, 3]);
 * // => true
 *
 * _.isObjectLike(_.noop);
 * // => false
 *
 * _.isObjectLike(null);
 * // => false
 */ function isObjectLike(value) {
    return !!value && typeof value == 'object';
}
/**
 * Checks if `value` is a plain object, that is, an object created by the
 * `Object` constructor or one with a `[[Prototype]]` of `null`.
 *
 * @static
 * @memberOf _
 * @since 0.8.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a plain object, else `false`.
 * @example
 *
 * function Foo() {
 *   this.a = 1;
 * }
 *
 * _.isPlainObject(new Foo);
 * // => false
 *
 * _.isPlainObject([1, 2, 3]);
 * // => false
 *
 * _.isPlainObject({ 'x': 0, 'y': 0 });
 * // => true
 *
 * _.isPlainObject(Object.create(null));
 * // => true
 */ function isPlainObject(value) {
    if (!isObjectLike(value) || objectToString.call(value) != objectTag || isHostObject(value)) {
        return false;
    }
    var proto = getPrototype(value);
    if (proto === null) {
        return true;
    }
    var Ctor = hasOwnProperty.call(proto, 'constructor') && proto.constructor;
    return typeof Ctor == 'function' && Ctor instanceof Ctor && funcToString.call(Ctor) == objectCtorString;
}
module.exports = isPlainObject;
}),
"[project]/Documents/GitHub/buenasv2/node_modules/lodash.isstring/index.js [app-route] (ecmascript)", ((__turbopack_context__, module, exports) => {

/**
 * lodash 4.0.1 (Custom Build) <https://lodash.com/>
 * Build: `lodash modularize exports="npm" -o ./`
 * Copyright 2012-2016 The Dojo Foundation <http://dojofoundation.org/>
 * Based on Underscore.js 1.8.3 <http://underscorejs.org/LICENSE>
 * Copyright 2009-2016 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
 * Available under MIT license <https://lodash.com/license>
 */ /** `Object#toString` result references. */ var stringTag = '[object String]';
/** Used for built-in method references. */ var objectProto = Object.prototype;
/**
 * Used to resolve the [`toStringTag`](http://ecma-international.org/ecma-262/6.0/#sec-object.prototype.tostring)
 * of values.
 */ var objectToString = objectProto.toString;
/**
 * Checks if `value` is classified as an `Array` object.
 *
 * @static
 * @memberOf _
 * @type Function
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is correctly classified, else `false`.
 * @example
 *
 * _.isArray([1, 2, 3]);
 * // => true
 *
 * _.isArray(document.body.children);
 * // => false
 *
 * _.isArray('abc');
 * // => false
 *
 * _.isArray(_.noop);
 * // => false
 */ var isArray = Array.isArray;
/**
 * Checks if `value` is object-like. A value is object-like if it's not `null`
 * and has a `typeof` result of "object".
 *
 * @static
 * @memberOf _
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is object-like, else `false`.
 * @example
 *
 * _.isObjectLike({});
 * // => true
 *
 * _.isObjectLike([1, 2, 3]);
 * // => true
 *
 * _.isObjectLike(_.noop);
 * // => false
 *
 * _.isObjectLike(null);
 * // => false
 */ function isObjectLike(value) {
    return !!value && typeof value == 'object';
}
/**
 * Checks if `value` is classified as a `String` primitive or object.
 *
 * @static
 * @memberOf _
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is correctly classified, else `false`.
 * @example
 *
 * _.isString('abc');
 * // => true
 *
 * _.isString(1);
 * // => false
 */ function isString(value) {
    return typeof value == 'string' || !isArray(value) && isObjectLike(value) && objectToString.call(value) == stringTag;
}
module.exports = isString;
}),
"[project]/Documents/GitHub/buenasv2/node_modules/lodash.once/index.js [app-route] (ecmascript)", ((__turbopack_context__, module, exports) => {

/**
 * lodash (Custom Build) <https://lodash.com/>
 * Build: `lodash modularize exports="npm" -o ./`
 * Copyright jQuery Foundation and other contributors <https://jquery.org/>
 * Released under MIT license <https://lodash.com/license>
 * Based on Underscore.js 1.8.3 <http://underscorejs.org/LICENSE>
 * Copyright Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
 */ /** Used as the `TypeError` message for "Functions" methods. */ var FUNC_ERROR_TEXT = 'Expected a function';
/** Used as references for various `Number` constants. */ var INFINITY = 1 / 0, MAX_INTEGER = 1.7976931348623157e+308, NAN = 0 / 0;
/** `Object#toString` result references. */ var symbolTag = '[object Symbol]';
/** Used to match leading and trailing whitespace. */ var reTrim = /^\s+|\s+$/g;
/** Used to detect bad signed hexadecimal string values. */ var reIsBadHex = /^[-+]0x[0-9a-f]+$/i;
/** Used to detect binary string values. */ var reIsBinary = /^0b[01]+$/i;
/** Used to detect octal string values. */ var reIsOctal = /^0o[0-7]+$/i;
/** Built-in method references without a dependency on `root`. */ var freeParseInt = parseInt;
/** Used for built-in method references. */ var objectProto = Object.prototype;
/**
 * Used to resolve the
 * [`toStringTag`](http://ecma-international.org/ecma-262/7.0/#sec-object.prototype.tostring)
 * of values.
 */ var objectToString = objectProto.toString;
/**
 * Creates a function that invokes `func`, with the `this` binding and arguments
 * of the created function, while it's called less than `n` times. Subsequent
 * calls to the created function return the result of the last `func` invocation.
 *
 * @static
 * @memberOf _
 * @since 3.0.0
 * @category Function
 * @param {number} n The number of calls at which `func` is no longer invoked.
 * @param {Function} func The function to restrict.
 * @returns {Function} Returns the new restricted function.
 * @example
 *
 * jQuery(element).on('click', _.before(5, addContactToList));
 * // => Allows adding up to 4 contacts to the list.
 */ function before(n, func) {
    var result;
    if (typeof func != 'function') {
        throw new TypeError(FUNC_ERROR_TEXT);
    }
    n = toInteger(n);
    return function() {
        if (--n > 0) {
            result = func.apply(this, arguments);
        }
        if (n <= 1) {
            func = undefined;
        }
        return result;
    };
}
/**
 * Creates a function that is restricted to invoking `func` once. Repeat calls
 * to the function return the value of the first invocation. The `func` is
 * invoked with the `this` binding and arguments of the created function.
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @category Function
 * @param {Function} func The function to restrict.
 * @returns {Function} Returns the new restricted function.
 * @example
 *
 * var initialize = _.once(createApplication);
 * initialize();
 * initialize();
 * // => `createApplication` is invoked once
 */ function once(func) {
    return before(2, func);
}
/**
 * Checks if `value` is the
 * [language type](http://www.ecma-international.org/ecma-262/7.0/#sec-ecmascript-language-types)
 * of `Object`. (e.g. arrays, functions, objects, regexes, `new Number(0)`, and `new String('')`)
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is an object, else `false`.
 * @example
 *
 * _.isObject({});
 * // => true
 *
 * _.isObject([1, 2, 3]);
 * // => true
 *
 * _.isObject(_.noop);
 * // => true
 *
 * _.isObject(null);
 * // => false
 */ function isObject(value) {
    var type = typeof value;
    return !!value && (type == 'object' || type == 'function');
}
/**
 * Checks if `value` is object-like. A value is object-like if it's not `null`
 * and has a `typeof` result of "object".
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is object-like, else `false`.
 * @example
 *
 * _.isObjectLike({});
 * // => true
 *
 * _.isObjectLike([1, 2, 3]);
 * // => true
 *
 * _.isObjectLike(_.noop);
 * // => false
 *
 * _.isObjectLike(null);
 * // => false
 */ function isObjectLike(value) {
    return !!value && typeof value == 'object';
}
/**
 * Checks if `value` is classified as a `Symbol` primitive or object.
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a symbol, else `false`.
 * @example
 *
 * _.isSymbol(Symbol.iterator);
 * // => true
 *
 * _.isSymbol('abc');
 * // => false
 */ function isSymbol(value) {
    return typeof value == 'symbol' || isObjectLike(value) && objectToString.call(value) == symbolTag;
}
/**
 * Converts `value` to a finite number.
 *
 * @static
 * @memberOf _
 * @since 4.12.0
 * @category Lang
 * @param {*} value The value to convert.
 * @returns {number} Returns the converted number.
 * @example
 *
 * _.toFinite(3.2);
 * // => 3.2
 *
 * _.toFinite(Number.MIN_VALUE);
 * // => 5e-324
 *
 * _.toFinite(Infinity);
 * // => 1.7976931348623157e+308
 *
 * _.toFinite('3.2');
 * // => 3.2
 */ function toFinite(value) {
    if (!value) {
        return value === 0 ? value : 0;
    }
    value = toNumber(value);
    if (value === INFINITY || value === -INFINITY) {
        var sign = value < 0 ? -1 : 1;
        return sign * MAX_INTEGER;
    }
    return value === value ? value : 0;
}
/**
 * Converts `value` to an integer.
 *
 * **Note:** This method is loosely based on
 * [`ToInteger`](http://www.ecma-international.org/ecma-262/7.0/#sec-tointeger).
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to convert.
 * @returns {number} Returns the converted integer.
 * @example
 *
 * _.toInteger(3.2);
 * // => 3
 *
 * _.toInteger(Number.MIN_VALUE);
 * // => 0
 *
 * _.toInteger(Infinity);
 * // => 1.7976931348623157e+308
 *
 * _.toInteger('3.2');
 * // => 3
 */ function toInteger(value) {
    var result = toFinite(value), remainder = result % 1;
    return result === result ? remainder ? result - remainder : result : 0;
}
/**
 * Converts `value` to a number.
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to process.
 * @returns {number} Returns the number.
 * @example
 *
 * _.toNumber(3.2);
 * // => 3.2
 *
 * _.toNumber(Number.MIN_VALUE);
 * // => 5e-324
 *
 * _.toNumber(Infinity);
 * // => Infinity
 *
 * _.toNumber('3.2');
 * // => 3.2
 */ function toNumber(value) {
    if (typeof value == 'number') {
        return value;
    }
    if (isSymbol(value)) {
        return NAN;
    }
    if (isObject(value)) {
        var other = typeof value.valueOf == 'function' ? value.valueOf() : value;
        value = isObject(other) ? other + '' : other;
    }
    if (typeof value != 'string') {
        return value === 0 ? value : +value;
    }
    value = value.replace(reTrim, '');
    var isBinary = reIsBinary.test(value);
    return isBinary || reIsOctal.test(value) ? freeParseInt(value.slice(2), isBinary ? 2 : 8) : reIsBadHex.test(value) ? NAN : +value;
}
module.exports = once;
}),
"[project]/Documents/GitHub/buenasv2/node_modules/jsonwebtoken/sign.js [app-route] (ecmascript)", ((__turbopack_context__, module, exports) => {

const timespan = __turbopack_context__.r("[project]/Documents/GitHub/buenasv2/node_modules/jsonwebtoken/lib/timespan.js [app-route] (ecmascript)");
const PS_SUPPORTED = __turbopack_context__.r("[project]/Documents/GitHub/buenasv2/node_modules/jsonwebtoken/lib/psSupported.js [app-route] (ecmascript)");
const validateAsymmetricKey = __turbopack_context__.r("[project]/Documents/GitHub/buenasv2/node_modules/jsonwebtoken/lib/validateAsymmetricKey.js [app-route] (ecmascript)");
const jws = __turbopack_context__.r("[project]/Documents/GitHub/buenasv2/node_modules/jws/index.js [app-route] (ecmascript)");
const includes = __turbopack_context__.r("[project]/Documents/GitHub/buenasv2/node_modules/lodash.includes/index.js [app-route] (ecmascript)");
const isBoolean = __turbopack_context__.r("[project]/Documents/GitHub/buenasv2/node_modules/lodash.isboolean/index.js [app-route] (ecmascript)");
const isInteger = __turbopack_context__.r("[project]/Documents/GitHub/buenasv2/node_modules/lodash.isinteger/index.js [app-route] (ecmascript)");
const isNumber = __turbopack_context__.r("[project]/Documents/GitHub/buenasv2/node_modules/lodash.isnumber/index.js [app-route] (ecmascript)");
const isPlainObject = __turbopack_context__.r("[project]/Documents/GitHub/buenasv2/node_modules/lodash.isplainobject/index.js [app-route] (ecmascript)");
const isString = __turbopack_context__.r("[project]/Documents/GitHub/buenasv2/node_modules/lodash.isstring/index.js [app-route] (ecmascript)");
const once = __turbopack_context__.r("[project]/Documents/GitHub/buenasv2/node_modules/lodash.once/index.js [app-route] (ecmascript)");
const { KeyObject, createSecretKey, createPrivateKey } = __turbopack_context__.r("[externals]/crypto [external] (crypto, cjs)");
const SUPPORTED_ALGS = [
    'RS256',
    'RS384',
    'RS512',
    'ES256',
    'ES384',
    'ES512',
    'HS256',
    'HS384',
    'HS512',
    'none'
];
if (PS_SUPPORTED) {
    SUPPORTED_ALGS.splice(3, 0, 'PS256', 'PS384', 'PS512');
}
const sign_options_schema = {
    expiresIn: {
        isValid: function(value) {
            return isInteger(value) || isString(value) && value;
        },
        message: '"expiresIn" should be a number of seconds or string representing a timespan'
    },
    notBefore: {
        isValid: function(value) {
            return isInteger(value) || isString(value) && value;
        },
        message: '"notBefore" should be a number of seconds or string representing a timespan'
    },
    audience: {
        isValid: function(value) {
            return isString(value) || Array.isArray(value);
        },
        message: '"audience" must be a string or array'
    },
    algorithm: {
        isValid: includes.bind(null, SUPPORTED_ALGS),
        message: '"algorithm" must be a valid string enum value'
    },
    header: {
        isValid: isPlainObject,
        message: '"header" must be an object'
    },
    encoding: {
        isValid: isString,
        message: '"encoding" must be a string'
    },
    issuer: {
        isValid: isString,
        message: '"issuer" must be a string'
    },
    subject: {
        isValid: isString,
        message: '"subject" must be a string'
    },
    jwtid: {
        isValid: isString,
        message: '"jwtid" must be a string'
    },
    noTimestamp: {
        isValid: isBoolean,
        message: '"noTimestamp" must be a boolean'
    },
    keyid: {
        isValid: isString,
        message: '"keyid" must be a string'
    },
    mutatePayload: {
        isValid: isBoolean,
        message: '"mutatePayload" must be a boolean'
    },
    allowInsecureKeySizes: {
        isValid: isBoolean,
        message: '"allowInsecureKeySizes" must be a boolean'
    },
    allowInvalidAsymmetricKeyTypes: {
        isValid: isBoolean,
        message: '"allowInvalidAsymmetricKeyTypes" must be a boolean'
    }
};
const registered_claims_schema = {
    iat: {
        isValid: isNumber,
        message: '"iat" should be a number of seconds'
    },
    exp: {
        isValid: isNumber,
        message: '"exp" should be a number of seconds'
    },
    nbf: {
        isValid: isNumber,
        message: '"nbf" should be a number of seconds'
    }
};
function validate(schema, allowUnknown, object, parameterName) {
    if (!isPlainObject(object)) {
        throw new Error('Expected "' + parameterName + '" to be a plain object.');
    }
    Object.keys(object).forEach(function(key) {
        const validator = schema[key];
        if (!validator) {
            if (!allowUnknown) {
                throw new Error('"' + key + '" is not allowed in "' + parameterName + '"');
            }
            return;
        }
        if (!validator.isValid(object[key])) {
            throw new Error(validator.message);
        }
    });
}
function validateOptions(options) {
    return validate(sign_options_schema, false, options, 'options');
}
function validatePayload(payload) {
    return validate(registered_claims_schema, true, payload, 'payload');
}
const options_to_payload = {
    'audience': 'aud',
    'issuer': 'iss',
    'subject': 'sub',
    'jwtid': 'jti'
};
const options_for_objects = [
    'expiresIn',
    'notBefore',
    'noTimestamp',
    'audience',
    'issuer',
    'subject',
    'jwtid'
];
module.exports = function(payload, secretOrPrivateKey, options, callback) {
    if (typeof options === 'function') {
        callback = options;
        options = {};
    } else {
        options = options || {};
    }
    const isObjectPayload = typeof payload === 'object' && !Buffer.isBuffer(payload);
    const header = Object.assign({
        alg: options.algorithm || 'HS256',
        typ: isObjectPayload ? 'JWT' : undefined,
        kid: options.keyid
    }, options.header);
    function failure(err) {
        if (callback) {
            return callback(err);
        }
        throw err;
    }
    if (!secretOrPrivateKey && options.algorithm !== 'none') {
        return failure(new Error('secretOrPrivateKey must have a value'));
    }
    if (secretOrPrivateKey != null && !(secretOrPrivateKey instanceof KeyObject)) {
        try {
            secretOrPrivateKey = createPrivateKey(secretOrPrivateKey);
        } catch (_) {
            try {
                secretOrPrivateKey = createSecretKey(typeof secretOrPrivateKey === 'string' ? Buffer.from(secretOrPrivateKey) : secretOrPrivateKey);
            } catch (_) {
                return failure(new Error('secretOrPrivateKey is not valid key material'));
            }
        }
    }
    if (header.alg.startsWith('HS') && secretOrPrivateKey.type !== 'secret') {
        return failure(new Error(`secretOrPrivateKey must be a symmetric key when using ${header.alg}`));
    } else if (/^(?:RS|PS|ES)/.test(header.alg)) {
        if (secretOrPrivateKey.type !== 'private') {
            return failure(new Error(`secretOrPrivateKey must be an asymmetric key when using ${header.alg}`));
        }
        if (!options.allowInsecureKeySizes && !header.alg.startsWith('ES') && secretOrPrivateKey.asymmetricKeyDetails !== undefined && //KeyObject.asymmetricKeyDetails is supported in Node 15+
        secretOrPrivateKey.asymmetricKeyDetails.modulusLength < 2048) {
            return failure(new Error(`secretOrPrivateKey has a minimum key size of 2048 bits for ${header.alg}`));
        }
    }
    if (typeof payload === 'undefined') {
        return failure(new Error('payload is required'));
    } else if (isObjectPayload) {
        try {
            validatePayload(payload);
        } catch (error) {
            return failure(error);
        }
        if (!options.mutatePayload) {
            payload = Object.assign({}, payload);
        }
    } else {
        const invalid_options = options_for_objects.filter(function(opt) {
            return typeof options[opt] !== 'undefined';
        });
        if (invalid_options.length > 0) {
            return failure(new Error('invalid ' + invalid_options.join(',') + ' option for ' + typeof payload + ' payload'));
        }
    }
    if (typeof payload.exp !== 'undefined' && typeof options.expiresIn !== 'undefined') {
        return failure(new Error('Bad "options.expiresIn" option the payload already has an "exp" property.'));
    }
    if (typeof payload.nbf !== 'undefined' && typeof options.notBefore !== 'undefined') {
        return failure(new Error('Bad "options.notBefore" option the payload already has an "nbf" property.'));
    }
    try {
        validateOptions(options);
    } catch (error) {
        return failure(error);
    }
    if (!options.allowInvalidAsymmetricKeyTypes) {
        try {
            validateAsymmetricKey(header.alg, secretOrPrivateKey);
        } catch (error) {
            return failure(error);
        }
    }
    const timestamp = payload.iat || Math.floor(Date.now() / 1000);
    if (options.noTimestamp) {
        delete payload.iat;
    } else if (isObjectPayload) {
        payload.iat = timestamp;
    }
    if (typeof options.notBefore !== 'undefined') {
        try {
            payload.nbf = timespan(options.notBefore, timestamp);
        } catch (err) {
            return failure(err);
        }
        if (typeof payload.nbf === 'undefined') {
            return failure(new Error('"notBefore" should be a number of seconds or string representing a timespan eg: "1d", "20h", 60'));
        }
    }
    if (typeof options.expiresIn !== 'undefined' && typeof payload === 'object') {
        try {
            payload.exp = timespan(options.expiresIn, timestamp);
        } catch (err) {
            return failure(err);
        }
        if (typeof payload.exp === 'undefined') {
            return failure(new Error('"expiresIn" should be a number of seconds or string representing a timespan eg: "1d", "20h", 60'));
        }
    }
    Object.keys(options_to_payload).forEach(function(key) {
        const claim = options_to_payload[key];
        if (typeof options[key] !== 'undefined') {
            if (typeof payload[claim] !== 'undefined') {
                return failure(new Error('Bad "options.' + key + '" option. The payload already has an "' + claim + '" property.'));
            }
            payload[claim] = options[key];
        }
    });
    const encoding = options.encoding || 'utf8';
    if (typeof callback === 'function') {
        callback = callback && once(callback);
        jws.createSign({
            header: header,
            privateKey: secretOrPrivateKey,
            payload: payload,
            encoding: encoding
        }).once('error', callback).once('done', function(signature) {
            // TODO: Remove in favor of the modulus length check before signing once node 15+ is the minimum supported version
            if (!options.allowInsecureKeySizes && /^(?:RS|PS)/.test(header.alg) && signature.length < 256) {
                return callback(new Error(`secretOrPrivateKey has a minimum key size of 2048 bits for ${header.alg}`));
            }
            callback(null, signature);
        });
    } else {
        let signature = jws.sign({
            header: header,
            payload: payload,
            secret: secretOrPrivateKey,
            encoding: encoding
        });
        // TODO: Remove in favor of the modulus length check before signing once node 15+ is the minimum supported version
        if (!options.allowInsecureKeySizes && /^(?:RS|PS)/.test(header.alg) && signature.length < 256) {
            throw new Error(`secretOrPrivateKey has a minimum key size of 2048 bits for ${header.alg}`);
        }
        return signature;
    }
};
}),
"[project]/Documents/GitHub/buenasv2/node_modules/jsonwebtoken/index.js [app-route] (ecmascript)", ((__turbopack_context__, module, exports) => {

module.exports = {
    decode: __turbopack_context__.r("[project]/Documents/GitHub/buenasv2/node_modules/jsonwebtoken/decode.js [app-route] (ecmascript)"),
    verify: __turbopack_context__.r("[project]/Documents/GitHub/buenasv2/node_modules/jsonwebtoken/verify.js [app-route] (ecmascript)"),
    sign: __turbopack_context__.r("[project]/Documents/GitHub/buenasv2/node_modules/jsonwebtoken/sign.js [app-route] (ecmascript)"),
    JsonWebTokenError: __turbopack_context__.r("[project]/Documents/GitHub/buenasv2/node_modules/jsonwebtoken/lib/JsonWebTokenError.js [app-route] (ecmascript)"),
    NotBeforeError: __turbopack_context__.r("[project]/Documents/GitHub/buenasv2/node_modules/jsonwebtoken/lib/NotBeforeError.js [app-route] (ecmascript)"),
    TokenExpiredError: __turbopack_context__.r("[project]/Documents/GitHub/buenasv2/node_modules/jsonwebtoken/lib/TokenExpiredError.js [app-route] (ecmascript)")
};
}),
"[project]/Documents/GitHub/buenasv2/node_modules/dotenv/package.json (json)", ((__turbopack_context__) => {

__turbopack_context__.v({"name":"dotenv","version":"17.2.3","description":"Loads environment variables from .env file","main":"lib/main.js","types":"lib/main.d.ts","exports":{".":{"types":"./lib/main.d.ts","require":"./lib/main.js","default":"./lib/main.js"},"./config":"./config.js","./config.js":"./config.js","./lib/env-options":"./lib/env-options.js","./lib/env-options.js":"./lib/env-options.js","./lib/cli-options":"./lib/cli-options.js","./lib/cli-options.js":"./lib/cli-options.js","./package.json":"./package.json"},"scripts":{"dts-check":"tsc --project tests/types/tsconfig.json","lint":"standard","pretest":"npm run lint && npm run dts-check","test":"tap run tests/**/*.js --allow-empty-coverage --disable-coverage --timeout=60000","test:coverage":"tap run tests/**/*.js --show-full-coverage --timeout=60000 --coverage-report=text --coverage-report=lcov","prerelease":"npm test","release":"standard-version"},"repository":{"type":"git","url":"git://github.com/motdotla/dotenv.git"},"homepage":"https://github.com/motdotla/dotenv#readme","funding":"https://dotenvx.com","keywords":["dotenv","env",".env","environment","variables","config","settings"],"readmeFilename":"README.md","license":"BSD-2-Clause","devDependencies":{"@types/node":"^18.11.3","decache":"^4.6.2","sinon":"^14.0.1","standard":"^17.0.0","standard-version":"^9.5.0","tap":"^19.2.0","typescript":"^4.8.4"},"engines":{"node":">=12"},"browser":{"fs":false}});}),
"[project]/Documents/GitHub/buenasv2/node_modules/dotenv/lib/main.js [app-route] (ecmascript)", ((__turbopack_context__, module, exports) => {

const fs = __turbopack_context__.r("[externals]/fs [external] (fs, cjs)");
const path = __turbopack_context__.r("[externals]/path [external] (path, cjs)");
const os = __turbopack_context__.r("[externals]/os [external] (os, cjs)");
const crypto = __turbopack_context__.r("[externals]/crypto [external] (crypto, cjs)");
const packageJson = __turbopack_context__.r("[project]/Documents/GitHub/buenasv2/node_modules/dotenv/package.json (json)");
const version = packageJson.version;
// Array of tips to display randomly
const TIPS = [
    '🔐 encrypt with Dotenvx: https://dotenvx.com',
    '🔐 prevent committing .env to code: https://dotenvx.com/precommit',
    '🔐 prevent building .env in docker: https://dotenvx.com/prebuild',
    '📡 add observability to secrets: https://dotenvx.com/ops',
    '👥 sync secrets across teammates & machines: https://dotenvx.com/ops',
    '🗂️ backup and recover secrets: https://dotenvx.com/ops',
    '✅ audit secrets and track compliance: https://dotenvx.com/ops',
    '🔄 add secrets lifecycle management: https://dotenvx.com/ops',
    '🔑 add access controls to secrets: https://dotenvx.com/ops',
    '🛠️  run anywhere with `dotenvx run -- yourcommand`',
    '⚙️  specify custom .env file path with { path: \'/custom/path/.env\' }',
    '⚙️  enable debug logging with { debug: true }',
    '⚙️  override existing env vars with { override: true }',
    '⚙️  suppress all logs with { quiet: true }',
    '⚙️  write to custom object with { processEnv: myObject }',
    '⚙️  load multiple .env files with { path: [\'.env.local\', \'.env\'] }'
];
// Get a random tip from the tips array
function _getRandomTip() {
    return TIPS[Math.floor(Math.random() * TIPS.length)];
}
function parseBoolean(value) {
    if (typeof value === 'string') {
        return ![
            'false',
            '0',
            'no',
            'off',
            ''
        ].includes(value.toLowerCase());
    }
    return Boolean(value);
}
function supportsAnsi() {
    return process.stdout.isTTY // && process.env.TERM !== 'dumb'
    ;
}
function dim(text) {
    return supportsAnsi() ? `\x1b[2m${text}\x1b[0m` : text;
}
const LINE = /(?:^|^)\s*(?:export\s+)?([\w.-]+)(?:\s*=\s*?|:\s+?)(\s*'(?:\\'|[^'])*'|\s*"(?:\\"|[^"])*"|\s*`(?:\\`|[^`])*`|[^#\r\n]+)?\s*(?:#.*)?(?:$|$)/mg;
// Parse src into an Object
function parse(src) {
    const obj = {};
    // Convert buffer to string
    let lines = src.toString();
    // Convert line breaks to same format
    lines = lines.replace(/\r\n?/mg, '\n');
    let match;
    while((match = LINE.exec(lines)) != null){
        const key = match[1];
        // Default undefined or null to empty string
        let value = match[2] || '';
        // Remove whitespace
        value = value.trim();
        // Check if double quoted
        const maybeQuote = value[0];
        // Remove surrounding quotes
        value = value.replace(/^(['"`])([\s\S]*)\1$/mg, '$2');
        // Expand newlines if double quoted
        if (maybeQuote === '"') {
            value = value.replace(/\\n/g, '\n');
            value = value.replace(/\\r/g, '\r');
        }
        // Add to object
        obj[key] = value;
    }
    return obj;
}
function _parseVault(options) {
    options = options || {};
    const vaultPath = _vaultPath(options);
    options.path = vaultPath; // parse .env.vault
    const result = DotenvModule.configDotenv(options);
    if (!result.parsed) {
        const err = new Error(`MISSING_DATA: Cannot parse ${vaultPath} for an unknown reason`);
        err.code = 'MISSING_DATA';
        throw err;
    }
    // handle scenario for comma separated keys - for use with key rotation
    // example: DOTENV_KEY="dotenv://:key_1234@dotenvx.com/vault/.env.vault?environment=prod,dotenv://:key_7890@dotenvx.com/vault/.env.vault?environment=prod"
    const keys = _dotenvKey(options).split(',');
    const length = keys.length;
    let decrypted;
    for(let i = 0; i < length; i++){
        try {
            // Get full key
            const key = keys[i].trim();
            // Get instructions for decrypt
            const attrs = _instructions(result, key);
            // Decrypt
            decrypted = DotenvModule.decrypt(attrs.ciphertext, attrs.key);
            break;
        } catch (error) {
            // last key
            if (i + 1 >= length) {
                throw error;
            }
        // try next key
        }
    }
    // Parse decrypted .env string
    return DotenvModule.parse(decrypted);
}
function _warn(message) {
    console.error(`[dotenv@${version}][WARN] ${message}`);
}
function _debug(message) {
    console.log(`[dotenv@${version}][DEBUG] ${message}`);
}
function _log(message) {
    console.log(`[dotenv@${version}] ${message}`);
}
function _dotenvKey(options) {
    // prioritize developer directly setting options.DOTENV_KEY
    if (options && options.DOTENV_KEY && options.DOTENV_KEY.length > 0) {
        return options.DOTENV_KEY;
    }
    // secondary infra already contains a DOTENV_KEY environment variable
    if (process.env.DOTENV_KEY && process.env.DOTENV_KEY.length > 0) {
        return process.env.DOTENV_KEY;
    }
    // fallback to empty string
    return '';
}
function _instructions(result, dotenvKey) {
    // Parse DOTENV_KEY. Format is a URI
    let uri;
    try {
        uri = new URL(dotenvKey);
    } catch (error) {
        if (error.code === 'ERR_INVALID_URL') {
            const err = new Error('INVALID_DOTENV_KEY: Wrong format. Must be in valid uri format like dotenv://:key_1234@dotenvx.com/vault/.env.vault?environment=development');
            err.code = 'INVALID_DOTENV_KEY';
            throw err;
        }
        throw error;
    }
    // Get decrypt key
    const key = uri.password;
    if (!key) {
        const err = new Error('INVALID_DOTENV_KEY: Missing key part');
        err.code = 'INVALID_DOTENV_KEY';
        throw err;
    }
    // Get environment
    const environment = uri.searchParams.get('environment');
    if (!environment) {
        const err = new Error('INVALID_DOTENV_KEY: Missing environment part');
        err.code = 'INVALID_DOTENV_KEY';
        throw err;
    }
    // Get ciphertext payload
    const environmentKey = `DOTENV_VAULT_${environment.toUpperCase()}`;
    const ciphertext = result.parsed[environmentKey] // DOTENV_VAULT_PRODUCTION
    ;
    if (!ciphertext) {
        const err = new Error(`NOT_FOUND_DOTENV_ENVIRONMENT: Cannot locate environment ${environmentKey} in your .env.vault file.`);
        err.code = 'NOT_FOUND_DOTENV_ENVIRONMENT';
        throw err;
    }
    return {
        ciphertext,
        key
    };
}
function _vaultPath(options) {
    let possibleVaultPath = null;
    if (options && options.path && options.path.length > 0) {
        if (Array.isArray(options.path)) {
            for (const filepath of options.path){
                if (fs.existsSync(filepath)) {
                    possibleVaultPath = filepath.endsWith('.vault') ? filepath : `${filepath}.vault`;
                }
            }
        } else {
            possibleVaultPath = options.path.endsWith('.vault') ? options.path : `${options.path}.vault`;
        }
    } else {
        possibleVaultPath = path.resolve(process.cwd(), '.env.vault');
    }
    if (fs.existsSync(possibleVaultPath)) {
        return possibleVaultPath;
    }
    return null;
}
function _resolveHome(envPath) {
    return envPath[0] === '~' ? path.join(os.homedir(), envPath.slice(1)) : envPath;
}
function _configVault(options) {
    const debug = parseBoolean(process.env.DOTENV_CONFIG_DEBUG || options && options.debug);
    const quiet = parseBoolean(process.env.DOTENV_CONFIG_QUIET || options && options.quiet);
    if (debug || !quiet) {
        _log('Loading env from encrypted .env.vault');
    }
    const parsed = DotenvModule._parseVault(options);
    let processEnv = process.env;
    if (options && options.processEnv != null) {
        processEnv = options.processEnv;
    }
    DotenvModule.populate(processEnv, parsed, options);
    return {
        parsed
    };
}
function configDotenv(options) {
    const dotenvPath = path.resolve(process.cwd(), '.env');
    let encoding = 'utf8';
    let processEnv = process.env;
    if (options && options.processEnv != null) {
        processEnv = options.processEnv;
    }
    let debug = parseBoolean(processEnv.DOTENV_CONFIG_DEBUG || options && options.debug);
    let quiet = parseBoolean(processEnv.DOTENV_CONFIG_QUIET || options && options.quiet);
    if (options && options.encoding) {
        encoding = options.encoding;
    } else {
        if (debug) {
            _debug('No encoding is specified. UTF-8 is used by default');
        }
    }
    let optionPaths = [
        dotenvPath
    ] // default, look for .env
    ;
    if (options && options.path) {
        if (!Array.isArray(options.path)) {
            optionPaths = [
                _resolveHome(options.path)
            ];
        } else {
            optionPaths = []; // reset default
            for (const filepath of options.path){
                optionPaths.push(_resolveHome(filepath));
            }
        }
    }
    // Build the parsed data in a temporary object (because we need to return it).  Once we have the final
    // parsed data, we will combine it with process.env (or options.processEnv if provided).
    let lastError;
    const parsedAll = {};
    for (const path of optionPaths){
        try {
            // Specifying an encoding returns a string instead of a buffer
            const parsed = DotenvModule.parse(fs.readFileSync(path, {
                encoding
            }));
            DotenvModule.populate(parsedAll, parsed, options);
        } catch (e) {
            if (debug) {
                _debug(`Failed to load ${path} ${e.message}`);
            }
            lastError = e;
        }
    }
    const populated = DotenvModule.populate(processEnv, parsedAll, options);
    // handle user settings DOTENV_CONFIG_ options inside .env file(s)
    debug = parseBoolean(processEnv.DOTENV_CONFIG_DEBUG || debug);
    quiet = parseBoolean(processEnv.DOTENV_CONFIG_QUIET || quiet);
    if (debug || !quiet) {
        const keysCount = Object.keys(populated).length;
        const shortPaths = [];
        for (const filePath of optionPaths){
            try {
                const relative = path.relative(process.cwd(), filePath);
                shortPaths.push(relative);
            } catch (e) {
                if (debug) {
                    _debug(`Failed to load ${filePath} ${e.message}`);
                }
                lastError = e;
            }
        }
        _log(`injecting env (${keysCount}) from ${shortPaths.join(',')} ${dim(`-- tip: ${_getRandomTip()}`)}`);
    }
    if (lastError) {
        return {
            parsed: parsedAll,
            error: lastError
        };
    } else {
        return {
            parsed: parsedAll
        };
    }
}
// Populates process.env from .env file
function config(options) {
    // fallback to original dotenv if DOTENV_KEY is not set
    if (_dotenvKey(options).length === 0) {
        return DotenvModule.configDotenv(options);
    }
    const vaultPath = _vaultPath(options);
    // dotenvKey exists but .env.vault file does not exist
    if (!vaultPath) {
        _warn(`You set DOTENV_KEY but you are missing a .env.vault file at ${vaultPath}. Did you forget to build it?`);
        return DotenvModule.configDotenv(options);
    }
    return DotenvModule._configVault(options);
}
function decrypt(encrypted, keyStr) {
    const key = Buffer.from(keyStr.slice(-64), 'hex');
    let ciphertext = Buffer.from(encrypted, 'base64');
    const nonce = ciphertext.subarray(0, 12);
    const authTag = ciphertext.subarray(-16);
    ciphertext = ciphertext.subarray(12, -16);
    try {
        const aesgcm = crypto.createDecipheriv('aes-256-gcm', key, nonce);
        aesgcm.setAuthTag(authTag);
        return `${aesgcm.update(ciphertext)}${aesgcm.final()}`;
    } catch (error) {
        const isRange = error instanceof RangeError;
        const invalidKeyLength = error.message === 'Invalid key length';
        const decryptionFailed = error.message === 'Unsupported state or unable to authenticate data';
        if (isRange || invalidKeyLength) {
            const err = new Error('INVALID_DOTENV_KEY: It must be 64 characters long (or more)');
            err.code = 'INVALID_DOTENV_KEY';
            throw err;
        } else if (decryptionFailed) {
            const err = new Error('DECRYPTION_FAILED: Please check your DOTENV_KEY');
            err.code = 'DECRYPTION_FAILED';
            throw err;
        } else {
            throw error;
        }
    }
}
// Populate process.env with parsed values
function populate(processEnv, parsed, options = {}) {
    const debug = Boolean(options && options.debug);
    const override = Boolean(options && options.override);
    const populated = {};
    if (typeof parsed !== 'object') {
        const err = new Error('OBJECT_REQUIRED: Please check the processEnv argument being passed to populate');
        err.code = 'OBJECT_REQUIRED';
        throw err;
    }
    // Set process.env
    for (const key of Object.keys(parsed)){
        if (Object.prototype.hasOwnProperty.call(processEnv, key)) {
            if (override === true) {
                processEnv[key] = parsed[key];
                populated[key] = parsed[key];
            }
            if (debug) {
                if (override === true) {
                    _debug(`"${key}" is already defined and WAS overwritten`);
                } else {
                    _debug(`"${key}" is already defined and was NOT overwritten`);
                }
            }
        } else {
            processEnv[key] = parsed[key];
            populated[key] = parsed[key];
        }
    }
    return populated;
}
const DotenvModule = {
    configDotenv,
    _configVault,
    _parseVault,
    config,
    decrypt,
    parse,
    populate
};
module.exports.configDotenv = DotenvModule.configDotenv;
module.exports._configVault = DotenvModule._configVault;
module.exports._parseVault = DotenvModule._parseVault;
module.exports.config = DotenvModule.config;
module.exports.decrypt = DotenvModule.decrypt;
module.exports.parse = DotenvModule.parse;
module.exports.populate = DotenvModule.populate;
module.exports = DotenvModule;
}),
"[project]/Documents/GitHub/buenasv2/node_modules/@prisma/debug/dist/index.mjs [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "Debug",
    ()=>Debug,
    "clearLogs",
    ()=>clearLogs,
    "default",
    ()=>index_default,
    "getLogs",
    ()=>getLogs
]);
var __defProp = Object.defineProperty;
var __export = (target, all)=>{
    for(var name in all)__defProp(target, name, {
        get: all[name],
        enumerable: true
    });
};
// ../../node_modules/.pnpm/kleur@4.1.5/node_modules/kleur/colors.mjs
var colors_exports = {};
__export(colors_exports, {
    $: ()=>$,
    bgBlack: ()=>bgBlack,
    bgBlue: ()=>bgBlue,
    bgCyan: ()=>bgCyan,
    bgGreen: ()=>bgGreen,
    bgMagenta: ()=>bgMagenta,
    bgRed: ()=>bgRed,
    bgWhite: ()=>bgWhite,
    bgYellow: ()=>bgYellow,
    black: ()=>black,
    blue: ()=>blue,
    bold: ()=>bold,
    cyan: ()=>cyan,
    dim: ()=>dim,
    gray: ()=>gray,
    green: ()=>green,
    grey: ()=>grey,
    hidden: ()=>hidden,
    inverse: ()=>inverse,
    italic: ()=>italic,
    magenta: ()=>magenta,
    red: ()=>red,
    reset: ()=>reset,
    strikethrough: ()=>strikethrough,
    underline: ()=>underline,
    white: ()=>white,
    yellow: ()=>yellow
});
var FORCE_COLOR;
var NODE_DISABLE_COLORS;
var NO_COLOR;
var TERM;
var isTTY = true;
if (typeof process !== "undefined") {
    ({ FORCE_COLOR, NODE_DISABLE_COLORS, NO_COLOR, TERM } = process.env || {});
    isTTY = process.stdout && process.stdout.isTTY;
}
var $ = {
    enabled: !NODE_DISABLE_COLORS && NO_COLOR == null && TERM !== "dumb" && (FORCE_COLOR != null && FORCE_COLOR !== "0" || isTTY)
};
function init(x, y) {
    let rgx = new RegExp(`\\x1b\\[${y}m`, "g");
    let open = `\x1B[${x}m`, close = `\x1B[${y}m`;
    return function(txt) {
        if (!$.enabled || txt == null) return txt;
        return open + (!!~("" + txt).indexOf(close) ? txt.replace(rgx, close + open) : txt) + close;
    };
}
var reset = init(0, 0);
var bold = init(1, 22);
var dim = init(2, 22);
var italic = init(3, 23);
var underline = init(4, 24);
var inverse = init(7, 27);
var hidden = init(8, 28);
var strikethrough = init(9, 29);
var black = init(30, 39);
var red = init(31, 39);
var green = init(32, 39);
var yellow = init(33, 39);
var blue = init(34, 39);
var magenta = init(35, 39);
var cyan = init(36, 39);
var white = init(37, 39);
var gray = init(90, 39);
var grey = init(90, 39);
var bgBlack = init(40, 49);
var bgRed = init(41, 49);
var bgGreen = init(42, 49);
var bgYellow = init(43, 49);
var bgBlue = init(44, 49);
var bgMagenta = init(45, 49);
var bgCyan = init(46, 49);
var bgWhite = init(47, 49);
// src/index.ts
var MAX_ARGS_HISTORY = 100;
var COLORS = [
    "green",
    "yellow",
    "blue",
    "magenta",
    "cyan",
    "red"
];
var argsHistory = [];
var lastTimestamp = Date.now();
var lastColor = 0;
var processEnv = typeof process !== "undefined" ? process.env : {};
globalThis.DEBUG ??= processEnv.DEBUG ?? "";
globalThis.DEBUG_COLORS ??= processEnv.DEBUG_COLORS ? processEnv.DEBUG_COLORS === "true" : true;
var topProps = {
    enable (namespace) {
        if (typeof namespace === "string") {
            globalThis.DEBUG = namespace;
        }
    },
    disable () {
        const prev = globalThis.DEBUG;
        globalThis.DEBUG = "";
        return prev;
    },
    // this is the core logic to check if logging should happen or not
    enabled (namespace) {
        const listenedNamespaces = globalThis.DEBUG.split(",").map((s)=>{
            return s.replace(/[.+?^${}()|[\]\\]/g, "\\$&");
        });
        const isListened = listenedNamespaces.some((listenedNamespace)=>{
            if (listenedNamespace === "" || listenedNamespace[0] === "-") return false;
            return namespace.match(RegExp(listenedNamespace.split("*").join(".*") + "$"));
        });
        const isExcluded = listenedNamespaces.some((listenedNamespace)=>{
            if (listenedNamespace === "" || listenedNamespace[0] !== "-") return false;
            return namespace.match(RegExp(listenedNamespace.slice(1).split("*").join(".*") + "$"));
        });
        return isListened && !isExcluded;
    },
    log: (...args)=>{
        const [namespace, format, ...rest] = args;
        const logWithFormatting = console.warn ?? console.log;
        logWithFormatting(`${namespace} ${format}`, ...rest);
    },
    formatters: {}
};
function debugCreate(namespace) {
    const instanceProps = {
        color: COLORS[lastColor++ % COLORS.length],
        enabled: topProps.enabled(namespace),
        namespace,
        log: topProps.log,
        extend: ()=>{}
    };
    const debugCall = (...args)=>{
        const { enabled, namespace: namespace2, color, log } = instanceProps;
        if (args.length !== 0) {
            argsHistory.push([
                namespace2,
                ...args
            ]);
        }
        if (argsHistory.length > MAX_ARGS_HISTORY) {
            argsHistory.shift();
        }
        if (topProps.enabled(namespace2) || enabled) {
            const stringArgs = args.map((arg)=>{
                if (typeof arg === "string") {
                    return arg;
                }
                return safeStringify(arg);
            });
            const ms = `+${Date.now() - lastTimestamp}ms`;
            lastTimestamp = Date.now();
            if (globalThis.DEBUG_COLORS) {
                log(colors_exports[color](bold(namespace2)), ...stringArgs, colors_exports[color](ms));
            } else {
                log(namespace2, ...stringArgs, ms);
            }
        }
    };
    return new Proxy(debugCall, {
        get: (_, prop)=>instanceProps[prop],
        set: (_, prop, value)=>instanceProps[prop] = value
    });
}
var Debug = new Proxy(debugCreate, {
    get: (_, prop)=>topProps[prop],
    set: (_, prop, value)=>topProps[prop] = value
});
function safeStringify(value, indent = 2) {
    const cache = /* @__PURE__ */ new Set();
    return JSON.stringify(value, (key, value2)=>{
        if (typeof value2 === "object" && value2 !== null) {
            if (cache.has(value2)) {
                return `[Circular *]`;
            }
            cache.add(value2);
        } else if (typeof value2 === "bigint") {
            return value2.toString();
        }
        return value2;
    }, indent);
}
function getLogs(numChars = 7500) {
    const logs = argsHistory.map(([namespace, ...args])=>{
        return `${namespace} ${args.map((arg)=>{
            if (typeof arg === "string") {
                return arg;
            } else {
                return JSON.stringify(arg);
            }
        }).join(" ")}`;
    }).join("\n");
    if (logs.length < numChars) {
        return logs;
    }
    return logs.slice(-numChars);
}
function clearLogs() {
    argsHistory.length = 0;
}
var index_default = Debug;
;
}),
"[project]/Documents/GitHub/buenasv2/node_modules/@prisma/driver-adapter-utils/dist/index.mjs [app-route] (ecmascript) <locals>", ((__turbopack_context__) => {
"use strict";

// src/debug.ts
__turbopack_context__.s([
    "ColumnTypeEnum",
    ()=>ColumnTypeEnum,
    "DriverAdapterError",
    ()=>DriverAdapterError,
    "bindAdapter",
    ()=>bindAdapter,
    "bindMigrationAwareSqlAdapterFactory",
    ()=>bindMigrationAwareSqlAdapterFactory,
    "bindSqlAdapterFactory",
    ()=>bindSqlAdapterFactory,
    "err",
    ()=>err,
    "isDriverAdapterError",
    ()=>isDriverAdapterError,
    "mockAdapter",
    ()=>mockAdapter,
    "mockAdapterErrors",
    ()=>mockAdapterErrors,
    "mockAdapterFactory",
    ()=>mockAdapterFactory,
    "mockMigrationAwareAdapterFactory",
    ()=>mockMigrationAwareAdapterFactory,
    "ok",
    ()=>ok
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$Documents$2f$GitHub$2f$buenasv2$2f$node_modules$2f40$prisma$2f$debug$2f$dist$2f$index$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Documents/GitHub/buenasv2/node_modules/@prisma/debug/dist/index.mjs [app-route] (ecmascript)");
;
// src/error.ts
var DriverAdapterError = class extends Error {
    name = "DriverAdapterError";
    cause;
    constructor(payload){
        super(typeof payload["message"] === "string" ? payload["message"] : payload.kind);
        this.cause = payload;
    }
};
function isDriverAdapterError(error) {
    return error["name"] === "DriverAdapterError" && typeof error["cause"] === "object";
}
// src/result.ts
function ok(value) {
    return {
        ok: true,
        value,
        map (fn) {
            return ok(fn(value));
        },
        flatMap (fn) {
            return fn(value);
        }
    };
}
function err(error) {
    return {
        ok: false,
        error,
        map () {
            return err(error);
        },
        flatMap () {
            return err(error);
        }
    };
}
// src/binder.ts
var debug = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Documents$2f$GitHub$2f$buenasv2$2f$node_modules$2f40$prisma$2f$debug$2f$dist$2f$index$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__["Debug"])("driver-adapter-utils");
var ErrorRegistryInternal = class {
    registeredErrors = [];
    consumeError(id) {
        return this.registeredErrors[id];
    }
    registerNewError(error) {
        let i = 0;
        while(this.registeredErrors[i] !== void 0){
            i++;
        }
        this.registeredErrors[i] = {
            error
        };
        return i;
    }
};
function copySymbolsFromSource(source, target) {
    const symbols = Object.getOwnPropertySymbols(source);
    const symbolObject = Object.fromEntries(symbols.map((symbol)=>[
            symbol,
            true
        ]));
    Object.assign(target, symbolObject);
}
var bindMigrationAwareSqlAdapterFactory = (adapterFactory)=>{
    const errorRegistry = new ErrorRegistryInternal();
    const boundFactory = {
        adapterName: adapterFactory.adapterName,
        provider: adapterFactory.provider,
        errorRegistry,
        connect: async (...args)=>{
            const ctx = await wrapAsync(errorRegistry, adapterFactory.connect.bind(adapterFactory))(...args);
            return ctx.map((ctx2)=>bindAdapter(ctx2, errorRegistry));
        },
        connectToShadowDb: async (...args)=>{
            const ctx = await wrapAsync(errorRegistry, adapterFactory.connectToShadowDb.bind(adapterFactory))(...args);
            return ctx.map((ctx2)=>bindAdapter(ctx2, errorRegistry));
        }
    };
    copySymbolsFromSource(adapterFactory, boundFactory);
    return boundFactory;
};
var bindSqlAdapterFactory = (adapterFactory)=>{
    const errorRegistry = new ErrorRegistryInternal();
    const boundFactory = {
        adapterName: adapterFactory.adapterName,
        provider: adapterFactory.provider,
        errorRegistry,
        connect: async (...args)=>{
            const ctx = await wrapAsync(errorRegistry, adapterFactory.connect.bind(adapterFactory))(...args);
            return ctx.map((ctx2)=>bindAdapter(ctx2, errorRegistry));
        }
    };
    copySymbolsFromSource(adapterFactory, boundFactory);
    return boundFactory;
};
var bindAdapter = (adapter, errorRegistry = new ErrorRegistryInternal())=>{
    const boundAdapter = {
        adapterName: adapter.adapterName,
        errorRegistry,
        queryRaw: wrapAsync(errorRegistry, adapter.queryRaw.bind(adapter)),
        executeRaw: wrapAsync(errorRegistry, adapter.executeRaw.bind(adapter)),
        executeScript: wrapAsync(errorRegistry, adapter.executeScript.bind(adapter)),
        dispose: wrapAsync(errorRegistry, adapter.dispose.bind(adapter)),
        provider: adapter.provider,
        startTransaction: async (...args)=>{
            const ctx = await wrapAsync(errorRegistry, adapter.startTransaction.bind(adapter))(...args);
            return ctx.map((ctx2)=>bindTransaction(errorRegistry, ctx2));
        }
    };
    if (adapter.getConnectionInfo) {
        boundAdapter.getConnectionInfo = wrapSync(errorRegistry, adapter.getConnectionInfo.bind(adapter));
    }
    return boundAdapter;
};
var bindTransaction = (errorRegistry, transaction)=>{
    return {
        adapterName: transaction.adapterName,
        provider: transaction.provider,
        options: transaction.options,
        queryRaw: wrapAsync(errorRegistry, transaction.queryRaw.bind(transaction)),
        executeRaw: wrapAsync(errorRegistry, transaction.executeRaw.bind(transaction)),
        commit: wrapAsync(errorRegistry, transaction.commit.bind(transaction)),
        rollback: wrapAsync(errorRegistry, transaction.rollback.bind(transaction))
    };
};
function wrapAsync(registry, fn) {
    return async (...args)=>{
        try {
            return ok(await fn(...args));
        } catch (error) {
            debug("[error@wrapAsync]", error);
            if (isDriverAdapterError(error)) {
                return err(error.cause);
            }
            const id = registry.registerNewError(error);
            return err({
                kind: "GenericJs",
                id
            });
        }
    };
}
function wrapSync(registry, fn) {
    return (...args)=>{
        try {
            return ok(fn(...args));
        } catch (error) {
            debug("[error@wrapSync]", error);
            if (isDriverAdapterError(error)) {
                return err(error.cause);
            }
            const id = registry.registerNewError(error);
            return err({
                kind: "GenericJs",
                id
            });
        }
    };
}
// src/const.ts
var ColumnTypeEnum = {
    // Scalars
    Int32: 0,
    Int64: 1,
    Float: 2,
    Double: 3,
    Numeric: 4,
    Boolean: 5,
    Character: 6,
    Text: 7,
    Date: 8,
    Time: 9,
    DateTime: 10,
    Json: 11,
    Enum: 12,
    Bytes: 13,
    Set: 14,
    Uuid: 15,
    // Arrays
    Int32Array: 64,
    Int64Array: 65,
    FloatArray: 66,
    DoubleArray: 67,
    NumericArray: 68,
    BooleanArray: 69,
    CharacterArray: 70,
    TextArray: 71,
    DateArray: 72,
    TimeArray: 73,
    DateTimeArray: 74,
    JsonArray: 75,
    EnumArray: 76,
    BytesArray: 77,
    UuidArray: 78,
    // Custom
    UnknownNumber: 128
};
// src/mock.ts
var mockAdapterErrors = {
    queryRaw: new Error("Not implemented: queryRaw"),
    executeRaw: new Error("Not implemented: executeRaw"),
    startTransaction: new Error("Not implemented: startTransaction"),
    executeScript: new Error("Not implemented: executeScript"),
    dispose: new Error("Not implemented: dispose")
};
function mockAdapter(provider) {
    return {
        provider,
        adapterName: "@prisma/adapter-mock",
        queryRaw: ()=>Promise.reject(mockAdapterErrors.queryRaw),
        executeRaw: ()=>Promise.reject(mockAdapterErrors.executeRaw),
        startTransaction: ()=>Promise.reject(mockAdapterErrors.startTransaction),
        executeScript: ()=>Promise.reject(mockAdapterErrors.executeScript),
        dispose: ()=>Promise.reject(mockAdapterErrors.dispose),
        [Symbol.for("adapter.mockAdapter")]: true
    };
}
function mockAdapterFactory(provider) {
    return {
        provider,
        adapterName: "@prisma/adapter-mock",
        connect: ()=>Promise.resolve(mockAdapter(provider)),
        [Symbol.for("adapter.mockAdapterFactory")]: true
    };
}
function mockMigrationAwareAdapterFactory(provider) {
    return {
        provider,
        adapterName: "@prisma/adapter-mock",
        connect: ()=>Promise.resolve(mockAdapter(provider)),
        connectToShadowDb: ()=>Promise.resolve(mockAdapter(provider)),
        [Symbol.for("adapter.mockMigrationAwareAdapterFactory")]: true
    };
}
;
}),
"[project]/Documents/GitHub/buenasv2/node_modules/postgres-array/index.js [app-route] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

const BACKSLASH = '\\';
const DQUOT = '"';
const LBRACE = '{';
const RBRACE = '}';
const LBRACKET = '[';
const EQUALS = '=';
const COMMA = ',';
/** When the raw value is this, it means a literal `null` */ const NULL_STRING = 'NULL';
/**
 * Parses an array according to
 * https://www.postgresql.org/docs/17/arrays.html#ARRAYS-IO
 *
 * Trusts the data (mostly), so only hook up to trusted Postgres servers.
 */ function makeParseArrayWithTransform(transform) {
    const haveTransform = transform != null;
    return function parseArray(str) {
        const rbraceIndex = str.length - 1;
        if (rbraceIndex === 1) {
            return [];
        }
        if (str[rbraceIndex] !== RBRACE) {
            throw new Error('Invalid array text - must end with }');
        }
        // If starts with `[`, it is specifying the index boundas. Skip past first `=`.
        let position = 0;
        if (str[position] === LBRACKET) {
            position = str.indexOf(EQUALS) + 1;
        }
        if (str[position++] !== LBRACE) {
            throw new Error('Invalid array text - must start with {');
        }
        const output = [];
        let current = output;
        const stack = [];
        let currentStringStart = position;
        let currentString = '';
        let expectValue = true;
        for(; position < rbraceIndex; ++position){
            let char = str[position];
            // > The array output routine will put double quotes around element values if
            // > they are empty strings, contain curly braces, delimiter characters, double
            // > quotes, backslashes, or white space, or match the word NULL. Double quotes
            // > and backslashes embedded in element values will be backslash-escaped.
            if (char === DQUOT) {
                // It's escaped
                currentStringStart = ++position;
                let dquot = str.indexOf(DQUOT, currentStringStart);
                let backSlash = str.indexOf(BACKSLASH, currentStringStart);
                while(backSlash !== -1 && backSlash < dquot){
                    position = backSlash;
                    const part = str.slice(currentStringStart, position);
                    currentString += part;
                    currentStringStart = ++position;
                    if (dquot === position++) {
                        // This was an escaped doublequote; find the next one!
                        dquot = str.indexOf(DQUOT, position);
                    }
                    // Either way, find the next backslash
                    backSlash = str.indexOf(BACKSLASH, position);
                }
                position = dquot;
                const part = str.slice(currentStringStart, position);
                currentString += part;
                current.push(haveTransform ? transform(currentString) : currentString);
                currentString = '';
                expectValue = false;
            } else if (char === LBRACE) {
                const newArray = [];
                current.push(newArray);
                stack.push(current);
                current = newArray;
                currentStringStart = position + 1;
                expectValue = true;
            } else if (char === COMMA) {
                expectValue = true;
            } else if (char === RBRACE) {
                expectValue = false;
                const arr = stack.pop();
                if (arr === undefined) {
                    throw new Error("Invalid array text - too many '}'");
                }
                current = arr;
            } else if (expectValue) {
                currentStringStart = position;
                while((char = str[position]) !== COMMA && char !== RBRACE && position < rbraceIndex){
                    ++position;
                }
                const part = str.slice(currentStringStart, position--);
                current.push(part === NULL_STRING ? null : haveTransform ? transform(part) : part);
                expectValue = false;
            } else {
                throw new Error('Was expecting delimeter');
            }
        }
        return output;
    };
}
const parseArray = makeParseArrayWithTransform();
exports.parse = (source, transform)=>transform != null ? makeParseArrayWithTransform(transform)(source) : parseArray(source);
}),
"[project]/Documents/GitHub/buenasv2/node_modules/@prisma/adapter-pg/dist/index.mjs [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

return __turbopack_context__.a(async (__turbopack_handle_async_dependencies__, __turbopack_async_result__) => { try {

// src/pg.ts
__turbopack_context__.s([
    "PrismaPg",
    ()=>PrismaPgAdapterFactory
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$Documents$2f$GitHub$2f$buenasv2$2f$node_modules$2f40$prisma$2f$debug$2f$dist$2f$index$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Documents/GitHub/buenasv2/node_modules/@prisma/debug/dist/index.mjs [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Documents$2f$GitHub$2f$buenasv2$2f$node_modules$2f40$prisma$2f$driver$2d$adapter$2d$utils$2f$dist$2f$index$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/Documents/GitHub/buenasv2/node_modules/@prisma/driver-adapter-utils/dist/index.mjs [app-route] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$externals$5d2f$pg__$5b$external$5d$__$28$pg$2c$__esm_import$29$__ = __turbopack_context__.i("[externals]/pg [external] (pg, esm_import)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Documents$2f$GitHub$2f$buenasv2$2f$node_modules$2f$postgres$2d$array$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Documents/GitHub/buenasv2/node_modules/postgres-array/index.js [app-route] (ecmascript)");
var __turbopack_async_dependencies__ = __turbopack_handle_async_dependencies__([
    __TURBOPACK__imported__module__$5b$externals$5d2f$pg__$5b$external$5d$__$28$pg$2c$__esm_import$29$__
]);
[__TURBOPACK__imported__module__$5b$externals$5d2f$pg__$5b$external$5d$__$28$pg$2c$__esm_import$29$__] = __turbopack_async_dependencies__.then ? (await __turbopack_async_dependencies__)() : __turbopack_async_dependencies__;
;
;
// package.json
var name = "@prisma/adapter-pg";
// src/constants.ts
var FIRST_NORMAL_OBJECT_ID = 16384;
;
;
;
var { types } = __TURBOPACK__imported__module__$5b$externals$5d2f$pg__$5b$external$5d$__$28$pg$2c$__esm_import$29$__["default"];
var { builtins: ScalarColumnType, getTypeParser } = types;
var AdditionalScalarColumnType = {
    NAME: 19
};
var ArrayColumnType = {
    BIT_ARRAY: 1561,
    BOOL_ARRAY: 1e3,
    BYTEA_ARRAY: 1001,
    BPCHAR_ARRAY: 1014,
    CHAR_ARRAY: 1002,
    CIDR_ARRAY: 651,
    DATE_ARRAY: 1182,
    FLOAT4_ARRAY: 1021,
    FLOAT8_ARRAY: 1022,
    INET_ARRAY: 1041,
    INT2_ARRAY: 1005,
    INT4_ARRAY: 1007,
    INT8_ARRAY: 1016,
    JSONB_ARRAY: 3807,
    JSON_ARRAY: 199,
    MONEY_ARRAY: 791,
    NUMERIC_ARRAY: 1231,
    OID_ARRAY: 1028,
    TEXT_ARRAY: 1009,
    TIMESTAMP_ARRAY: 1115,
    TIMESTAMPTZ_ARRAY: 1185,
    TIME_ARRAY: 1183,
    UUID_ARRAY: 2951,
    VARBIT_ARRAY: 1563,
    VARCHAR_ARRAY: 1015,
    XML_ARRAY: 143
};
var UnsupportedNativeDataType = class _UnsupportedNativeDataType extends Error {
    // map of type codes to type names
    static typeNames = {
        16: "bool",
        17: "bytea",
        18: "char",
        19: "name",
        20: "int8",
        21: "int2",
        22: "int2vector",
        23: "int4",
        24: "regproc",
        25: "text",
        26: "oid",
        27: "tid",
        28: "xid",
        29: "cid",
        30: "oidvector",
        32: "pg_ddl_command",
        71: "pg_type",
        75: "pg_attribute",
        81: "pg_proc",
        83: "pg_class",
        114: "json",
        142: "xml",
        194: "pg_node_tree",
        269: "table_am_handler",
        325: "index_am_handler",
        600: "point",
        601: "lseg",
        602: "path",
        603: "box",
        604: "polygon",
        628: "line",
        650: "cidr",
        700: "float4",
        701: "float8",
        705: "unknown",
        718: "circle",
        774: "macaddr8",
        790: "money",
        829: "macaddr",
        869: "inet",
        1033: "aclitem",
        1042: "bpchar",
        1043: "varchar",
        1082: "date",
        1083: "time",
        1114: "timestamp",
        1184: "timestamptz",
        1186: "interval",
        1266: "timetz",
        1560: "bit",
        1562: "varbit",
        1700: "numeric",
        1790: "refcursor",
        2202: "regprocedure",
        2203: "regoper",
        2204: "regoperator",
        2205: "regclass",
        2206: "regtype",
        2249: "record",
        2275: "cstring",
        2276: "any",
        2277: "anyarray",
        2278: "void",
        2279: "trigger",
        2280: "language_handler",
        2281: "internal",
        2283: "anyelement",
        2287: "_record",
        2776: "anynonarray",
        2950: "uuid",
        2970: "txid_snapshot",
        3115: "fdw_handler",
        3220: "pg_lsn",
        3310: "tsm_handler",
        3361: "pg_ndistinct",
        3402: "pg_dependencies",
        3500: "anyenum",
        3614: "tsvector",
        3615: "tsquery",
        3642: "gtsvector",
        3734: "regconfig",
        3769: "regdictionary",
        3802: "jsonb",
        3831: "anyrange",
        3838: "event_trigger",
        3904: "int4range",
        3906: "numrange",
        3908: "tsrange",
        3910: "tstzrange",
        3912: "daterange",
        3926: "int8range",
        4072: "jsonpath",
        4089: "regnamespace",
        4096: "regrole",
        4191: "regcollation",
        4451: "int4multirange",
        4532: "nummultirange",
        4533: "tsmultirange",
        4534: "tstzmultirange",
        4535: "datemultirange",
        4536: "int8multirange",
        4537: "anymultirange",
        4538: "anycompatiblemultirange",
        4600: "pg_brin_bloom_summary",
        4601: "pg_brin_minmax_multi_summary",
        5017: "pg_mcv_list",
        5038: "pg_snapshot",
        5069: "xid8",
        5077: "anycompatible",
        5078: "anycompatiblearray",
        5079: "anycompatiblenonarray",
        5080: "anycompatiblerange"
    };
    type;
    constructor(code){
        super();
        this.type = _UnsupportedNativeDataType.typeNames[code] || "Unknown";
        this.message = `Unsupported column type ${this.type}`;
    }
};
function fieldToColumnType(fieldTypeId) {
    switch(fieldTypeId){
        case ScalarColumnType.INT2:
        case ScalarColumnType.INT4:
            return __TURBOPACK__imported__module__$5b$project$5d2f$Documents$2f$GitHub$2f$buenasv2$2f$node_modules$2f40$prisma$2f$driver$2d$adapter$2d$utils$2f$dist$2f$index$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["ColumnTypeEnum"].Int32;
        case ScalarColumnType.INT8:
            return __TURBOPACK__imported__module__$5b$project$5d2f$Documents$2f$GitHub$2f$buenasv2$2f$node_modules$2f40$prisma$2f$driver$2d$adapter$2d$utils$2f$dist$2f$index$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["ColumnTypeEnum"].Int64;
        case ScalarColumnType.FLOAT4:
            return __TURBOPACK__imported__module__$5b$project$5d2f$Documents$2f$GitHub$2f$buenasv2$2f$node_modules$2f40$prisma$2f$driver$2d$adapter$2d$utils$2f$dist$2f$index$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["ColumnTypeEnum"].Float;
        case ScalarColumnType.FLOAT8:
            return __TURBOPACK__imported__module__$5b$project$5d2f$Documents$2f$GitHub$2f$buenasv2$2f$node_modules$2f40$prisma$2f$driver$2d$adapter$2d$utils$2f$dist$2f$index$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["ColumnTypeEnum"].Double;
        case ScalarColumnType.BOOL:
            return __TURBOPACK__imported__module__$5b$project$5d2f$Documents$2f$GitHub$2f$buenasv2$2f$node_modules$2f40$prisma$2f$driver$2d$adapter$2d$utils$2f$dist$2f$index$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["ColumnTypeEnum"].Boolean;
        case ScalarColumnType.DATE:
            return __TURBOPACK__imported__module__$5b$project$5d2f$Documents$2f$GitHub$2f$buenasv2$2f$node_modules$2f40$prisma$2f$driver$2d$adapter$2d$utils$2f$dist$2f$index$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["ColumnTypeEnum"].Date;
        case ScalarColumnType.TIME:
        case ScalarColumnType.TIMETZ:
            return __TURBOPACK__imported__module__$5b$project$5d2f$Documents$2f$GitHub$2f$buenasv2$2f$node_modules$2f40$prisma$2f$driver$2d$adapter$2d$utils$2f$dist$2f$index$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["ColumnTypeEnum"].Time;
        case ScalarColumnType.TIMESTAMP:
        case ScalarColumnType.TIMESTAMPTZ:
            return __TURBOPACK__imported__module__$5b$project$5d2f$Documents$2f$GitHub$2f$buenasv2$2f$node_modules$2f40$prisma$2f$driver$2d$adapter$2d$utils$2f$dist$2f$index$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["ColumnTypeEnum"].DateTime;
        case ScalarColumnType.NUMERIC:
        case ScalarColumnType.MONEY:
            return __TURBOPACK__imported__module__$5b$project$5d2f$Documents$2f$GitHub$2f$buenasv2$2f$node_modules$2f40$prisma$2f$driver$2d$adapter$2d$utils$2f$dist$2f$index$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["ColumnTypeEnum"].Numeric;
        case ScalarColumnType.JSON:
        case ScalarColumnType.JSONB:
            return __TURBOPACK__imported__module__$5b$project$5d2f$Documents$2f$GitHub$2f$buenasv2$2f$node_modules$2f40$prisma$2f$driver$2d$adapter$2d$utils$2f$dist$2f$index$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["ColumnTypeEnum"].Json;
        case ScalarColumnType.UUID:
            return __TURBOPACK__imported__module__$5b$project$5d2f$Documents$2f$GitHub$2f$buenasv2$2f$node_modules$2f40$prisma$2f$driver$2d$adapter$2d$utils$2f$dist$2f$index$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["ColumnTypeEnum"].Uuid;
        case ScalarColumnType.OID:
            return __TURBOPACK__imported__module__$5b$project$5d2f$Documents$2f$GitHub$2f$buenasv2$2f$node_modules$2f40$prisma$2f$driver$2d$adapter$2d$utils$2f$dist$2f$index$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["ColumnTypeEnum"].Int64;
        case ScalarColumnType.BPCHAR:
        case ScalarColumnType.TEXT:
        case ScalarColumnType.VARCHAR:
        case ScalarColumnType.BIT:
        case ScalarColumnType.VARBIT:
        case ScalarColumnType.INET:
        case ScalarColumnType.CIDR:
        case ScalarColumnType.XML:
        case AdditionalScalarColumnType.NAME:
            return __TURBOPACK__imported__module__$5b$project$5d2f$Documents$2f$GitHub$2f$buenasv2$2f$node_modules$2f40$prisma$2f$driver$2d$adapter$2d$utils$2f$dist$2f$index$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["ColumnTypeEnum"].Text;
        case ScalarColumnType.BYTEA:
            return __TURBOPACK__imported__module__$5b$project$5d2f$Documents$2f$GitHub$2f$buenasv2$2f$node_modules$2f40$prisma$2f$driver$2d$adapter$2d$utils$2f$dist$2f$index$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["ColumnTypeEnum"].Bytes;
        case ArrayColumnType.INT2_ARRAY:
        case ArrayColumnType.INT4_ARRAY:
            return __TURBOPACK__imported__module__$5b$project$5d2f$Documents$2f$GitHub$2f$buenasv2$2f$node_modules$2f40$prisma$2f$driver$2d$adapter$2d$utils$2f$dist$2f$index$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["ColumnTypeEnum"].Int32Array;
        case ArrayColumnType.FLOAT4_ARRAY:
            return __TURBOPACK__imported__module__$5b$project$5d2f$Documents$2f$GitHub$2f$buenasv2$2f$node_modules$2f40$prisma$2f$driver$2d$adapter$2d$utils$2f$dist$2f$index$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["ColumnTypeEnum"].FloatArray;
        case ArrayColumnType.FLOAT8_ARRAY:
            return __TURBOPACK__imported__module__$5b$project$5d2f$Documents$2f$GitHub$2f$buenasv2$2f$node_modules$2f40$prisma$2f$driver$2d$adapter$2d$utils$2f$dist$2f$index$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["ColumnTypeEnum"].DoubleArray;
        case ArrayColumnType.NUMERIC_ARRAY:
        case ArrayColumnType.MONEY_ARRAY:
            return __TURBOPACK__imported__module__$5b$project$5d2f$Documents$2f$GitHub$2f$buenasv2$2f$node_modules$2f40$prisma$2f$driver$2d$adapter$2d$utils$2f$dist$2f$index$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["ColumnTypeEnum"].NumericArray;
        case ArrayColumnType.BOOL_ARRAY:
            return __TURBOPACK__imported__module__$5b$project$5d2f$Documents$2f$GitHub$2f$buenasv2$2f$node_modules$2f40$prisma$2f$driver$2d$adapter$2d$utils$2f$dist$2f$index$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["ColumnTypeEnum"].BooleanArray;
        case ArrayColumnType.CHAR_ARRAY:
            return __TURBOPACK__imported__module__$5b$project$5d2f$Documents$2f$GitHub$2f$buenasv2$2f$node_modules$2f40$prisma$2f$driver$2d$adapter$2d$utils$2f$dist$2f$index$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["ColumnTypeEnum"].CharacterArray;
        case ArrayColumnType.BPCHAR_ARRAY:
        case ArrayColumnType.TEXT_ARRAY:
        case ArrayColumnType.VARCHAR_ARRAY:
        case ArrayColumnType.VARBIT_ARRAY:
        case ArrayColumnType.BIT_ARRAY:
        case ArrayColumnType.INET_ARRAY:
        case ArrayColumnType.CIDR_ARRAY:
        case ArrayColumnType.XML_ARRAY:
            return __TURBOPACK__imported__module__$5b$project$5d2f$Documents$2f$GitHub$2f$buenasv2$2f$node_modules$2f40$prisma$2f$driver$2d$adapter$2d$utils$2f$dist$2f$index$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["ColumnTypeEnum"].TextArray;
        case ArrayColumnType.DATE_ARRAY:
            return __TURBOPACK__imported__module__$5b$project$5d2f$Documents$2f$GitHub$2f$buenasv2$2f$node_modules$2f40$prisma$2f$driver$2d$adapter$2d$utils$2f$dist$2f$index$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["ColumnTypeEnum"].DateArray;
        case ArrayColumnType.TIME_ARRAY:
            return __TURBOPACK__imported__module__$5b$project$5d2f$Documents$2f$GitHub$2f$buenasv2$2f$node_modules$2f40$prisma$2f$driver$2d$adapter$2d$utils$2f$dist$2f$index$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["ColumnTypeEnum"].TimeArray;
        case ArrayColumnType.TIMESTAMP_ARRAY:
            return __TURBOPACK__imported__module__$5b$project$5d2f$Documents$2f$GitHub$2f$buenasv2$2f$node_modules$2f40$prisma$2f$driver$2d$adapter$2d$utils$2f$dist$2f$index$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["ColumnTypeEnum"].DateTimeArray;
        case ArrayColumnType.TIMESTAMPTZ_ARRAY:
            return __TURBOPACK__imported__module__$5b$project$5d2f$Documents$2f$GitHub$2f$buenasv2$2f$node_modules$2f40$prisma$2f$driver$2d$adapter$2d$utils$2f$dist$2f$index$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["ColumnTypeEnum"].DateTimeArray;
        case ArrayColumnType.JSON_ARRAY:
        case ArrayColumnType.JSONB_ARRAY:
            return __TURBOPACK__imported__module__$5b$project$5d2f$Documents$2f$GitHub$2f$buenasv2$2f$node_modules$2f40$prisma$2f$driver$2d$adapter$2d$utils$2f$dist$2f$index$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["ColumnTypeEnum"].JsonArray;
        case ArrayColumnType.BYTEA_ARRAY:
            return __TURBOPACK__imported__module__$5b$project$5d2f$Documents$2f$GitHub$2f$buenasv2$2f$node_modules$2f40$prisma$2f$driver$2d$adapter$2d$utils$2f$dist$2f$index$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["ColumnTypeEnum"].BytesArray;
        case ArrayColumnType.UUID_ARRAY:
            return __TURBOPACK__imported__module__$5b$project$5d2f$Documents$2f$GitHub$2f$buenasv2$2f$node_modules$2f40$prisma$2f$driver$2d$adapter$2d$utils$2f$dist$2f$index$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["ColumnTypeEnum"].UuidArray;
        case ArrayColumnType.INT8_ARRAY:
        case ArrayColumnType.OID_ARRAY:
            return __TURBOPACK__imported__module__$5b$project$5d2f$Documents$2f$GitHub$2f$buenasv2$2f$node_modules$2f40$prisma$2f$driver$2d$adapter$2d$utils$2f$dist$2f$index$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["ColumnTypeEnum"].Int64Array;
        default:
            if (fieldTypeId >= FIRST_NORMAL_OBJECT_ID) {
                return __TURBOPACK__imported__module__$5b$project$5d2f$Documents$2f$GitHub$2f$buenasv2$2f$node_modules$2f40$prisma$2f$driver$2d$adapter$2d$utils$2f$dist$2f$index$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["ColumnTypeEnum"].Text;
            }
            throw new UnsupportedNativeDataType(fieldTypeId);
    }
}
function normalize_array(element_normalizer) {
    return (str)=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$Documents$2f$GitHub$2f$buenasv2$2f$node_modules$2f$postgres$2d$array$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["parse"])(str, element_normalizer);
}
function normalize_numeric(numeric) {
    return numeric;
}
function normalize_date(date) {
    return date;
}
function normalize_timestamp(time) {
    return `${time.replace(" ", "T")}+00:00`;
}
function normalize_timestamptz(time) {
    return time.replace(" ", "T").replace(/[+-]\d{2}(:\d{2})?$/, "+00:00");
}
function normalize_time(time) {
    return time;
}
function normalize_timez(time) {
    return time.replace(/[+-]\d{2}(:\d{2})?$/, "");
}
function normalize_money(money) {
    return money.slice(1);
}
function normalize_xml(xml) {
    return xml;
}
function toJson(json) {
    return json;
}
function encodeBuffer(buffer) {
    return Array.from(new Uint8Array(buffer));
}
var parsePgBytes = getTypeParser(ScalarColumnType.BYTEA);
var parseBytesArray = getTypeParser(ArrayColumnType.BYTEA_ARRAY);
function normalizeByteaArray(serializedBytesArray) {
    const buffers = parseBytesArray(serializedBytesArray);
    return buffers.map((buf)=>buf ? encodeBuffer(buf) : null);
}
function convertBytes(serializedBytes) {
    const buffer = parsePgBytes(serializedBytes);
    return encodeBuffer(buffer);
}
function normalizeBit(bit) {
    return bit;
}
var customParsers = {
    [ScalarColumnType.NUMERIC]: normalize_numeric,
    [ArrayColumnType.NUMERIC_ARRAY]: normalize_array(normalize_numeric),
    [ScalarColumnType.TIME]: normalize_time,
    [ArrayColumnType.TIME_ARRAY]: normalize_array(normalize_time),
    [ScalarColumnType.TIMETZ]: normalize_timez,
    [ScalarColumnType.DATE]: normalize_date,
    [ArrayColumnType.DATE_ARRAY]: normalize_array(normalize_date),
    [ScalarColumnType.TIMESTAMP]: normalize_timestamp,
    [ArrayColumnType.TIMESTAMP_ARRAY]: normalize_array(normalize_timestamp),
    [ScalarColumnType.TIMESTAMPTZ]: normalize_timestamptz,
    [ArrayColumnType.TIMESTAMPTZ_ARRAY]: normalize_array(normalize_timestamptz),
    [ScalarColumnType.MONEY]: normalize_money,
    [ArrayColumnType.MONEY_ARRAY]: normalize_array(normalize_money),
    [ScalarColumnType.JSON]: toJson,
    [ArrayColumnType.JSON_ARRAY]: normalize_array(toJson),
    [ScalarColumnType.JSONB]: toJson,
    [ArrayColumnType.JSONB_ARRAY]: normalize_array(toJson),
    [ScalarColumnType.BYTEA]: convertBytes,
    [ArrayColumnType.BYTEA_ARRAY]: normalizeByteaArray,
    [ArrayColumnType.BIT_ARRAY]: normalize_array(normalizeBit),
    [ArrayColumnType.VARBIT_ARRAY]: normalize_array(normalizeBit),
    [ArrayColumnType.XML_ARRAY]: normalize_array(normalize_xml)
};
function mapArg(arg, argType) {
    if (arg === null) {
        return null;
    }
    if (Array.isArray(arg) && argType.arity === "list") {
        return arg.map((value)=>mapArg(value, argType));
    }
    if (typeof arg === "string" && argType.scalarType === "datetime") {
        arg = new Date(arg);
    }
    if (arg instanceof Date) {
        switch(argType.dbType){
            case "TIME":
            case "TIMETZ":
                return formatTime(arg);
            case "DATE":
                return formatDate(arg);
            default:
                return formatDateTime(arg);
        }
    }
    if (typeof arg === "string" && argType.scalarType === "bytes") {
        return Buffer.from(arg, "base64");
    }
    if (Array.isArray(arg) && argType.scalarType === "bytes") {
        return Buffer.from(arg);
    }
    if (ArrayBuffer.isView(arg)) {
        return Buffer.from(arg.buffer, arg.byteOffset, arg.byteLength);
    }
    return arg;
}
function formatDateTime(date) {
    const pad = (n, z = 2)=>String(n).padStart(z, "0");
    const ms = date.getUTCMilliseconds();
    return pad(date.getUTCFullYear(), 4) + "-" + pad(date.getUTCMonth() + 1) + "-" + pad(date.getUTCDate()) + " " + pad(date.getUTCHours()) + ":" + pad(date.getUTCMinutes()) + ":" + pad(date.getUTCSeconds()) + (ms ? "." + String(ms).padStart(3, "0") : "");
}
function formatDate(date) {
    const pad = (n, z = 2)=>String(n).padStart(z, "0");
    return pad(date.getUTCFullYear(), 4) + "-" + pad(date.getUTCMonth() + 1) + "-" + pad(date.getUTCDate());
}
function formatTime(date) {
    const pad = (n, z = 2)=>String(n).padStart(z, "0");
    const ms = date.getUTCMilliseconds();
    return pad(date.getUTCHours()) + ":" + pad(date.getUTCMinutes()) + ":" + pad(date.getUTCSeconds()) + (ms ? "." + String(ms).padStart(3, "0") : "");
}
// src/errors.ts
var TLS_ERRORS = /* @__PURE__ */ new Set([
    "UNABLE_TO_GET_ISSUER_CERT",
    "UNABLE_TO_GET_CRL",
    "UNABLE_TO_DECRYPT_CERT_SIGNATURE",
    "UNABLE_TO_DECRYPT_CRL_SIGNATURE",
    "UNABLE_TO_DECODE_ISSUER_PUBLIC_KEY",
    "CERT_SIGNATURE_FAILURE",
    "CRL_SIGNATURE_FAILURE",
    "CERT_NOT_YET_VALID",
    "CERT_HAS_EXPIRED",
    "CRL_NOT_YET_VALID",
    "CRL_HAS_EXPIRED",
    "ERROR_IN_CERT_NOT_BEFORE_FIELD",
    "ERROR_IN_CERT_NOT_AFTER_FIELD",
    "ERROR_IN_CRL_LAST_UPDATE_FIELD",
    "ERROR_IN_CRL_NEXT_UPDATE_FIELD",
    "DEPTH_ZERO_SELF_SIGNED_CERT",
    "SELF_SIGNED_CERT_IN_CHAIN",
    "UNABLE_TO_GET_ISSUER_CERT_LOCALLY",
    "UNABLE_TO_VERIFY_LEAF_SIGNATURE",
    "CERT_CHAIN_TOO_LONG",
    "CERT_REVOKED",
    "INVALID_CA",
    "INVALID_PURPOSE",
    "CERT_UNTRUSTED",
    "CERT_REJECTED",
    "HOSTNAME_MISMATCH",
    "ERR_TLS_CERT_ALTNAME_FORMAT",
    "ERR_TLS_CERT_ALTNAME_INVALID"
]);
var SOCKET_ERRORS = /* @__PURE__ */ new Set([
    "ENOTFOUND",
    "ECONNREFUSED",
    "ECONNRESET",
    "ETIMEDOUT"
]);
function convertDriverError(error) {
    if (isSocketError(error)) {
        return mapSocketError(error);
    }
    if (isTlsError(error)) {
        return {
            kind: "TlsConnectionError",
            reason: error.message
        };
    }
    if (isDriverError(error)) {
        return {
            originalCode: error.code,
            originalMessage: error.message,
            ...mapDriverError(error)
        };
    }
    throw error;
}
function mapDriverError(error) {
    switch(error.code){
        case "22001":
            return {
                kind: "LengthMismatch",
                column: error.column
            };
        case "22003":
            return {
                kind: "ValueOutOfRange",
                cause: error.message
            };
        case "23505":
            {
                const fields = error.detail?.match(/Key \(([^)]+)\)/)?.at(1)?.split(", ");
                return {
                    kind: "UniqueConstraintViolation",
                    constraint: fields !== void 0 ? {
                        fields
                    } : void 0
                };
            }
        case "23502":
            {
                const fields = error.detail?.match(/Key \(([^)]+)\)/)?.at(1)?.split(", ");
                return {
                    kind: "NullConstraintViolation",
                    constraint: fields !== void 0 ? {
                        fields
                    } : void 0
                };
            }
        case "23503":
            {
                let constraint;
                if (error.column) {
                    constraint = {
                        fields: [
                            error.column
                        ]
                    };
                } else if (error.constraint) {
                    constraint = {
                        index: error.constraint
                    };
                }
                return {
                    kind: "ForeignKeyConstraintViolation",
                    constraint
                };
            }
        case "3D000":
            return {
                kind: "DatabaseDoesNotExist",
                db: error.message.split(" ").at(1)?.split('"').at(1)
            };
        case "28000":
            return {
                kind: "DatabaseAccessDenied",
                db: error.message.split(",").find((s)=>s.startsWith(" database"))?.split('"').at(1)
            };
        case "28P01":
            return {
                kind: "AuthenticationFailed",
                user: error.message.split(" ").pop()?.split('"').at(1)
            };
        case "40001":
            return {
                kind: "TransactionWriteConflict"
            };
        case "42P01":
            return {
                kind: "TableDoesNotExist",
                table: error.message.split(" ").at(1)?.split('"').at(1)
            };
        case "42703":
            return {
                kind: "ColumnNotFound",
                column: error.message.split(" ").at(1)?.split('"').at(1)
            };
        case "42P04":
            return {
                kind: "DatabaseAlreadyExists",
                db: error.message.split(" ").at(1)?.split('"').at(1)
            };
        case "53300":
            return {
                kind: "TooManyConnections",
                cause: error.message
            };
        default:
            return {
                kind: "postgres",
                code: error.code ?? "N/A",
                severity: error.severity ?? "N/A",
                message: error.message,
                detail: error.detail,
                column: error.column,
                hint: error.hint
            };
    }
}
function isDriverError(error) {
    return typeof error.code === "string" && typeof error.message === "string" && typeof error.severity === "string" && (typeof error.detail === "string" || error.detail === void 0) && (typeof error.column === "string" || error.column === void 0) && (typeof error.hint === "string" || error.hint === void 0);
}
function mapSocketError(error) {
    switch(error.code){
        case "ENOTFOUND":
        case "ECONNREFUSED":
            return {
                kind: "DatabaseNotReachable",
                host: error.address ?? error.hostname,
                port: error.port
            };
        case "ECONNRESET":
            return {
                kind: "ConnectionClosed"
            };
        case "ETIMEDOUT":
            return {
                kind: "SocketTimeout"
            };
    }
}
function isSocketError(error) {
    return typeof error.code === "string" && typeof error.syscall === "string" && typeof error.errno === "number" && SOCKET_ERRORS.has(error.code);
}
function isTlsError(error) {
    if (typeof error.code === "string") {
        return TLS_ERRORS.has(error.code);
    }
    switch(error.message){
        case "The server does not support SSL connections":
        case "There was an error establishing an SSL connection":
            return true;
    }
    return false;
}
// src/pg.ts
var types2 = __TURBOPACK__imported__module__$5b$externals$5d2f$pg__$5b$external$5d$__$28$pg$2c$__esm_import$29$__["default"].types;
var debug = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Documents$2f$GitHub$2f$buenasv2$2f$node_modules$2f40$prisma$2f$debug$2f$dist$2f$index$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__["Debug"])("prisma:driver-adapter:pg");
var PgQueryable = class {
    constructor(client, pgOptions){
        this.client = client;
        this.pgOptions = pgOptions;
    }
    provider = "postgres";
    adapterName = name;
    /**
   * Execute a query given as SQL, interpolating the given parameters.
   */ async queryRaw(query) {
        const tag = "[js::query_raw]";
        debug(`${tag} %O`, query);
        const { fields, rows } = await this.performIO(query);
        const columnNames = fields.map((field)=>field.name);
        let columnTypes = [];
        try {
            columnTypes = fields.map((field)=>fieldToColumnType(field.dataTypeID));
        } catch (e) {
            if (e instanceof UnsupportedNativeDataType) {
                throw new __TURBOPACK__imported__module__$5b$project$5d2f$Documents$2f$GitHub$2f$buenasv2$2f$node_modules$2f40$prisma$2f$driver$2d$adapter$2d$utils$2f$dist$2f$index$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["DriverAdapterError"]({
                    kind: "UnsupportedNativeDataType",
                    type: e.type
                });
            }
            throw e;
        }
        const udtParser = this.pgOptions?.userDefinedTypeParser;
        if (udtParser) {
            for(let i = 0; i < fields.length; i++){
                const field = fields[i];
                if (field.dataTypeID >= FIRST_NORMAL_OBJECT_ID && !Object.hasOwn(customParsers, field.dataTypeID)) {
                    for(let j = 0; j < rows.length; j++){
                        rows[j][i] = await udtParser(field.dataTypeID, rows[j][i], this);
                    }
                }
            }
        }
        return {
            columnNames,
            columnTypes,
            rows
        };
    }
    /**
   * Execute a query given as SQL, interpolating the given parameters and
   * returning the number of affected rows.
   * Note: Queryable expects a u64, but napi.rs only supports u32.
   */ async executeRaw(query) {
        const tag = "[js::execute_raw]";
        debug(`${tag} %O`, query);
        return (await this.performIO(query)).rowCount ?? 0;
    }
    /**
   * Run a query against the database, returning the result set.
   * Should the query fail due to a connection error, the connection is
   * marked as unhealthy.
   */ async performIO(query) {
        const { sql, args } = query;
        const values = args.map((arg, i)=>mapArg(arg, query.argTypes[i]));
        try {
            const result = await this.client.query({
                text: sql,
                values,
                rowMode: "array",
                types: {
                    // This is the error expected:
                    // No overload matches this call.
                    // The last overload gave the following error.
                    // Type '(oid: number, format?: any) => (json: string) => unknown' is not assignable to type '{ <T>(oid: number): TypeParser<string, string | T>; <T>(oid: number, format: "text"): TypeParser<string, string | T>; <T>(oid: number, format: "binary"): TypeParser<...>; }'.
                    //   Type '(json: string) => unknown' is not assignable to type 'TypeParser<Buffer, any>'.
                    //     Types of parameters 'json' and 'value' are incompatible.
                    //       Type 'Buffer' is not assignable to type 'string'.ts(2769)
                    //
                    // Because pg-types types expect us to handle both binary and text protocol versions,
                    // where as far we can see, pg will ever pass only text version.
                    //
                    // @ts-expect-error
                    getTypeParser: (oid, format)=>{
                        if (format === "text" && customParsers[oid]) {
                            return customParsers[oid];
                        }
                        return types2.getTypeParser(oid, format);
                    }
                }
            }, values);
            return result;
        } catch (e) {
            this.onError(e);
        }
    }
    onError(error) {
        debug("Error in performIO: %O", error);
        throw new __TURBOPACK__imported__module__$5b$project$5d2f$Documents$2f$GitHub$2f$buenasv2$2f$node_modules$2f40$prisma$2f$driver$2d$adapter$2d$utils$2f$dist$2f$index$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["DriverAdapterError"](convertDriverError(error));
    }
};
var PgTransaction = class extends PgQueryable {
    constructor(client, options, pgOptions, cleanup){
        super(client, pgOptions);
        this.options = options;
        this.pgOptions = pgOptions;
        this.cleanup = cleanup;
    }
    async commit() {
        debug(`[js::commit]`);
        this.cleanup?.();
        this.client.release();
    }
    async rollback() {
        debug(`[js::rollback]`);
        this.cleanup?.();
        this.client.release();
    }
};
var PrismaPgAdapter = class extends PgQueryable {
    constructor(client, pgOptions, release){
        super(client);
        this.pgOptions = pgOptions;
        this.release = release;
    }
    async startTransaction(isolationLevel) {
        const options = {
            usePhantomQuery: false
        };
        const tag = "[js::startTransaction]";
        debug("%s options: %O", tag, options);
        const conn = await this.client.connect().catch((error)=>this.onError(error));
        const onError = (err)=>{
            debug(`Error from pool connection: ${err.message} %O`, err);
            this.pgOptions?.onConnectionError?.(err);
        };
        conn.on("error", onError);
        const cleanup = ()=>{
            conn.removeListener("error", onError);
        };
        try {
            const tx = new PgTransaction(conn, options, this.pgOptions, cleanup);
            await tx.executeRaw({
                sql: "BEGIN",
                args: [],
                argTypes: []
            });
            if (isolationLevel) {
                await tx.executeRaw({
                    sql: `SET TRANSACTION ISOLATION LEVEL ${isolationLevel}`,
                    args: [],
                    argTypes: []
                });
            }
            return tx;
        } catch (error) {
            cleanup();
            conn.release(error);
            this.onError(error);
        }
    }
    async executeScript(script) {
        const statements = script.split(";").map((stmt)=>stmt.trim()).filter((stmt)=>stmt.length > 0);
        for (const stmt of statements){
            try {
                await this.client.query(stmt);
            } catch (error) {
                this.onError(error);
            }
        }
    }
    getConnectionInfo() {
        return {
            schemaName: this.pgOptions?.schema,
            supportsRelationJoins: true
        };
    }
    async dispose() {
        return this.release?.();
    }
    underlyingDriver() {
        return this.client;
    }
};
var PrismaPgAdapterFactory = class {
    constructor(poolOrConfig, options){
        this.options = options;
        if (poolOrConfig instanceof __TURBOPACK__imported__module__$5b$externals$5d2f$pg__$5b$external$5d$__$28$pg$2c$__esm_import$29$__["default"].Pool) {
            this.externalPool = poolOrConfig;
            this.config = poolOrConfig.options;
        } else {
            this.externalPool = null;
            this.config = poolOrConfig;
        }
    }
    provider = "postgres";
    adapterName = name;
    config;
    externalPool;
    async connect() {
        const client = this.externalPool ?? new __TURBOPACK__imported__module__$5b$externals$5d2f$pg__$5b$external$5d$__$28$pg$2c$__esm_import$29$__["default"].Pool(this.config);
        const onIdleClientError = (err)=>{
            debug(`Error from idle pool client: ${err.message} %O`, err);
            this.options?.onPoolError?.(err);
        };
        client.on("error", onIdleClientError);
        return new PrismaPgAdapter(client, this.options, async ()=>{
            if (this.externalPool) {
                if (this.options?.disposeExternalPool) {
                    await this.externalPool.end();
                    this.externalPool = null;
                } else {
                    this.externalPool.removeListener("error", onIdleClientError);
                }
            } else {
                await client.end();
            }
        });
    }
    async connectToShadowDb() {
        const conn = await this.connect();
        const database = `prisma_migrate_shadow_db_${globalThis.crypto.randomUUID()}`;
        await conn.executeScript(`CREATE DATABASE "${database}"`);
        const client = new __TURBOPACK__imported__module__$5b$externals$5d2f$pg__$5b$external$5d$__$28$pg$2c$__esm_import$29$__["default"].Pool({
            ...this.config,
            database
        });
        return new PrismaPgAdapter(client, void 0, async ()=>{
            await conn.executeScript(`DROP DATABASE "${database}"`);
            await client.end();
        });
    }
};
;
__turbopack_async_result__();
} catch(e) { __turbopack_async_result__(e); } }, false);}),
];

//# sourceMappingURL=13547_990c3fe6._.js.map