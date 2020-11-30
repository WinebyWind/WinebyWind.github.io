/**
 * 人事移动公共js
 */
$.extend({
    // RSA公钥
    rsaKey: RSAUtils.getKeyPair('010001', '', '00a8526d6c9afe64fd481a49a05fadaca3'),
    // RSA加密
    rsa_enc: function(str) {
        return RSAUtils.encryptedString($.rsaKey, str);
    },
    base64_enc: function(str) {
        return $.base64.encode(str, true);
    },
    base64_dec: function(str) {
        return $.base64.decode(str, true);
    }
});