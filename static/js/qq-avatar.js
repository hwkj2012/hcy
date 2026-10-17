/**
 * QQ 头像定时刷新模块
 * 解决 QQ 头像缓存过期导致显示404的问题
 */
(function() {
    'use strict';

    // 所有需要刷新的 QQ 号列表
    var qqList = [
        '3466829709',  // xiaomu18
        '1782764161',  // 叶小光
        '2506442080',  // EarthMe
        '3337913379',  // klop233
        '1564722665',  // LiChirs93
        '3262178852',  // ATRI
        '1098355766',  // YGCcom
        '924549734',   // 有头发的光头强
        '3525951954'   // YBTsa
    ];

    /**
     * 刷新所有 QQ 头像
     */
    function refreshAvatars() {
        var timestamp = Date.now();

        qqList.forEach(function(qq) {
            var img = document.querySelector('img[src*="q1.qlogo.cn/g?b=qq&nk=' + qq + '"]');
            if (img) {
                img.src = 'https://q1.qlogo.cn/g?b=qq&nk=' + qq + '&s=100&t=' + timestamp;
            }
        });
    }

    // 立即刷新一次
    refreshAvatars();

    // 每 30 秒刷新一次（防止缓存）
    setInterval(refreshAvatars, 30000);

})();
