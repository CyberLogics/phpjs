function addcslashes (str, charlist) {
    // http://kevin.vanzonneveld.net
    // +   original by: Brett Zamir (http://brett-zamir.me)
    // %  note 1: We show double backslashes in the return value example code below because a JavaScript string will not
    // %  note 1: render them as backslashes otherwise
    // *     example 1: addcslashes('foo[ ]', 'A..z'); // Escape all ASCII within capital A to lower z range, including square brackets
    // *     returns 1: "\\f\\o\\o\\[ \\]"
    // *     example 2: addcslashes("zoo['.']", 'z..A'); // Only escape z, period, and A here since not a lower-to-higher range
    // *     returns 2: "\\zoo['\\.']"
    // *     example 3: addcslashes("@a\u0000\u0010\u00A9", "\0..\37!@\177..\377") == '\\@a\\000\\020\\302\\251'); // Escape as octals those specified and less than 32 (0x20) or greater than 126 (0x7E), but not otherwise
    // *     returns 3: true
    // *     example 4: addcslashes("\u0020\u007E", "\40..\175") == '\\ ~'); // Those between 32 (0x20 or 040) and 126 (0x7E or 0176) decimal value will be backslashed if specified (not octalized)
    // *     returns 4: true
    // *     example 5: addcslashes("\r\u0007\n", '\0..\37'); // Recognize C escape sequences if specified
    // *     returns 5: "\\r\\a\\n"
    // *     example 6: addcslashes("\r\u0007\n", '\0'); // Do not recognize C escape sequences if not specified
    // *     returns 7: "\r\u0007\n"
    var target = '',
        chrs = [],
        i = 0,
        j = 0,
        c = '',
        next = '',
        rangeBegin = '',
        rangeEnd = '',
        chr = '',
        begin = 0,
        end = 0,
        octalLength = 0,
        postOctalPos = 0,
        cca = 0,
        escHexGrp = [],
        encoded = '',
        percentHex = /%([\dA-Fa-f]+)/g;
    var _pad = function (n, c) {
        if ((n = n + "").length < c) {
            return new Array(++c - n.length).join("0") + n;
        } else {
            return n;
        }
    };

    for (i = 0; i < charlist.length; i++) {
        c = charlist.charAt(i);
        next = charlist.charAt(i + 1);
        if (c === '\\' && next && (/\d/).test(next)) { // Octal
            rangeBegin = charlist.slice(i + 1).match(/^\d+/)[0];
            octalLength = rangeBegin.length;
            postOctalPos = i + octalLength + 1;
            if (charlist.charAt(postOctalPos) + charlist.charAt(postOctalPos + 1) === '..') { // Octal begins range
                begin = rangeBegin.charCodeAt(0);
                if ((/\\\d/).test(charlist.charAt(postOctalPos + 2) + charlist.charAt(postOctalPos + 3))) { // Range ends with octal
                    rangeEnd = charlist.slice(postOctalPos + 3).match(/^\d+/)[0];
                    i += 1; // Skip range end backslash
                } else if (charlist.charAt(postOctalPos + 2)) { // Range ends with character
                    rangeEnd = charlist.charAt(postOctalPos + 2);
                } else {
                    throw 'Range with no end point';
                }
                end = rangeEnd.charCodeAt(0);
                if (end > begin) { // Treat as a range
                    for (j = begin; j <= end; j++) {
                        chrs.push(String.fromCharCode(j));
                    }
                } else { // Supposed to treat period, begin and end as individual characters only, not a range
                    chrs.push('.', rangeBegin, rangeEnd);
                }
                i += rangeEnd.length + 2; // Skip dots and range end (already skipped range end backslash if present)
            } else { // Octal is by itself
                chr = String.fromCharCode(parseInt(rangeBegin, 8));
                chrs.push(chr);
            }
            i += octalLength; // Skip range begin
        } else if (next + charlist.charAt(i + 2) === '..') { // Character begins range
            rangeBegin = c;
            begin = rangeBegin.charCodeAt(0);
            if ((/\\\d/).test(charlist.charAt(i + 3) + charlist.charAt(i + 4))) { // Range ends with octal
                rangeEnd = charlist.slice(i + 4).match(/^\d+/)[0];
                i += 1; // Skip range end backslash
            } else if (charlist.charAt(i + 3)) { // Range ends with character
                rangeEnd = charlist.charAt(i + 3);
            } else {
                throw 'Range with no end point';
            }
            end = rangeEnd.charCodeAt(0);
            if (end > begin) { // Treat as a range
                for (j = begin; j <= end; j++) {
                    chrs.push(String.fromCharCode(j));
                }
            } else { // Supposed to treat period, begin and end as individual characters only, not a range
                chrs.push('.', rangeBegin, rangeEnd);
            }
            i += rangeEnd.length + 2; // Skip dots and range end (already skipped range end backslash if present)
        } else { // Character is by itself
            chrs.push(c);
        }
    }

    for (i = 0; i < str.length; i++) {
        c = str.charAt(i);
        if (chrs.indexOf(c) !== -1) {
            target += '\\';
            cca = c.charCodeAt(0);
            if (cca < 32 || cca > 126) { // Needs special escaping
                switch (c) {
                case '\n':
                    target += 'n';
                    break;
                case '\t':
                    target += 't';
                    break;
                case '\u000D':
                    target += 'r';
                    break;
                case '\u0007':
                    target += 'a';
                    break;
                case '\v':
                    target += 'v';
                    break;
                case '\b':
                    target += 'b';
                    break;
                case '\f':
                    target += 'f';
                    break;
                default:
                    //target += _pad(cca.toString(8), 3);break; // Sufficient for UTF-16
                    encoded = encodeURIComponent(c);

                    // 3-length-padded UTF-8 octets
                    if ((escHexGrp = percentHex.exec(encoded)) !== null) {
                        target += _pad(parseInt(escHexGrp[1], 16).toString(8), 3); // already added a slash above
                    }
                    while ((escHexGrp = percentHex.exec(encoded)) !== null) {
                        target += '\\' + _pad(parseInt(escHexGrp[1], 16).toString(8), 3);
                    }
                    break;
                }
            } else { // Perform regular backslashed escaping
                target += c;
            }
        } else { // Just add the character unescaped
            target += c;
        }
    }
    return target;
}
