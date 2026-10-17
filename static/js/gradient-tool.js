(function() {
    'use strict';

    document.addEventListener('DOMContentLoaded', function() {
        var startInput = document.getElementById('start-color');
        var endInput = document.getElementById('end-color');
        var startSwatch = document.getElementById('start-color-swatch');
        var endSwatch = document.getElementById('end-color-swatch');
        var preview = document.getElementById('text-preview');
        var textInput = document.getElementById('gradient-input');
        var genBtn = document.getElementById('generate-gradient');
        var resultEl = document.getElementById('gradient-result');
        var copyBtn = document.getElementById('copy-gradient');
        if (!startInput || !endInput || !genBtn) return;

        var target = 'start';
        var presets = ['#ff0000','#ff9900','#ffff00','#00ff00','#0099ff','#6633ff','#ff00ff','#ff3399','#993300','#006600','#003366','#330066','#000000','#ffffff'];

        var palette = document.getElementById('color-palette');
        if (palette) {
            presets.forEach(function(c) {
                var d = document.createElement('div');
                d.style.backgroundColor = c; d.dataset.color = c;
                d.addEventListener('click', function() { setColor(c); });
                palette.appendChild(d);
            });
        }

        function setColor(c) {
            if (target === 'start') { startInput.value = c; startSwatch.style.backgroundColor = c; }
            else { endInput.value = c; endSwatch.style.backgroundColor = c; }
            updatePreview();
        }

        function updatePreview() {
            var txt = textInput.value || '渐变文字预览';
            var sc = startInput.value, ec = endInput.value;
            if (!/^#[0-9a-f]{6}$/i.test(sc) || !/^#[0-9a-f]{6}$/i.test(ec)) return;
            var sR=parseInt(sc.slice(1,3),16),sG=parseInt(sc.slice(3,5),16),sB=parseInt(sc.slice(5,7),16);
            var eR=parseInt(ec.slice(1,3),16),eG=parseInt(ec.slice(3,5),16),eB=parseInt(ec.slice(5,7),16);
            var fmts = Array.from(document.querySelectorAll('input[name="text-format"]:checked')).map(function(cb) { return cb.value; });
            var html = '';
            for (var i = 0; i < txt.length; i++) {
                var r = i / (txt.length - 1 || 1);
                var rr = Math.round(sR+(eR-sR)*r).toString(16).padStart(2,'0');
                var gg = Math.round(sG+(eG-sG)*r).toString(16).padStart(2,'0');
                var bb = Math.round(sB+(eB-sB)*r).toString(16).padStart(2,'0');
                var hex = '#' + rr + gg + bb;
                var style = 'color:' + hex;
                if (fmts.includes('bold')) style += ';font-weight:bold';
                if (fmts.includes('italic')) style += ';font-style:italic';
                if (fmts.includes('underline')) style += ';text-decoration:underline';
                if (fmts.includes('strikethrough')) style += ';text-decoration:line-through';
                html += '<span style="' + style + '">' + txt[i] + '</span>';
            }
            preview.innerHTML = html;
        }

        function generate() {
            var txt = textInput.value;
            if (!txt) { alert('请输入要转换的文字'); return; }
            var sc = startInput.value, ec = endInput.value;
            if (!/^#[0-9a-f]{6}$/i.test(sc) || !/^#[0-9a-f]{6}$/i.test(ec)) { alert('请输入有效的颜色代码'); return; }
            var sym = (document.querySelector('input[name="color-symbol"]:checked')?.value || 'section') === 'section' ? '§' : '&';
            var fmtMap = { bold:'l', italic:'o', underline:'n', strikethrough:'m', obfuscated:'k' };
            var fmts = Array.from(document.querySelectorAll('input[name="text-format"]:checked')).map(function(cb) { return fmtMap[cb.value]; }).filter(Boolean);
            var sR=parseInt(sc.slice(1,3),16),sG=parseInt(sc.slice(3,5),16),sB=parseInt(sc.slice(5,7),16);
            var eR=parseInt(ec.slice(1,3),16),eG=parseInt(ec.slice(3,5),16),eB=parseInt(ec.slice(5,7),16);
            var result = '';
            for (var i = 0; i < txt.length; i++) {
                var r = i / (txt.length - 1 || 1);
                var rr = Math.round(sR+(eR-sR)*r).toString(16).padStart(2,'0');
                var gg = Math.round(sG+(eG-sG)*r).toString(16).padStart(2,'0');
                var bb = Math.round(sB+(eB-sB)*r).toString(16).padStart(2,'0');
                var cc = sym + 'x' + sym + rr[0] + sym + rr[1] + sym + gg[0] + sym + gg[1] + sym + bb[0] + sym + bb[1];
                var fmt = fmts.map(function(f) { return sym + f; }).join('');
                result += cc + fmt + txt[i];
            }
            resultEl.textContent = result;
            resultEl.dataset.result = result;
            copyBtn.disabled = false;
            updatePreview();
        }
            // ====== 修复：点击/拖动渐变条选择颜色 ======
            var colorGradient = document.getElementById('color-gradient');
            var colorIndicator = document.getElementById('color-indicator');

            if (colorGradient) {
                // 从坐标获取颜色
                function getColorFromGradient(x, y) {
                    var rect = colorGradient.getBoundingClientRect();
                    var relX = Math.max(0, Math.min(1, (x - rect.left) / rect.width));
                    var relY = Math.max(0, Math.min(1, (y - rect.top) / rect.height));

                    var hue = relX * 300;
                    var lightness = 100 - relY * 50;
                    var saturation = 100 - relY * 30;

                    // HSL 转 HEX
                    function hslToHex(h, s, l) {
                        s /= 100;
                        l /= 100;
                        var a = s * Math.min(l, 1 - l);
                        function f(n) {
                            var k = (n + h / 30) % 12;
                            var color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
                            return Math.round(255 * color).toString(16).padStart(2, '0');
                        }
                        return '#' + f(0) + f(8) + f(4);
                    }

                    return hslToHex(hue, saturation, lightness);
                }

                // 更新颜色指示器位置
                function updateIndicator(x, y) {
                    if (!colorIndicator) return;
                    var rect = colorGradient.getBoundingClientRect();
                    var relX = Math.max(0, Math.min(1, (x - rect.left) / rect.width));
                    var relY = Math.max(0, Math.min(1, (y - rect.top) / rect.height));
                    colorIndicator.style.left = (relX * 100) + '%';
                    colorIndicator.style.top = (relY * 100) + '%';
                    colorIndicator.classList.remove('hidden');
                }

                // 点击选取颜色
                colorGradient.addEventListener('click', function(e) {
                    var color = getColorFromGradient(e.clientX, e.clientY);
                    setColor(color);
                    updateIndicator(e.clientX, e.clientY);
                });

                // 拖动选取颜色
                var isDraggingGradient = false;

                colorGradient.addEventListener('mousedown', function(e) {
                    isDraggingGradient = true;
                    var color = getColorFromGradient(e.clientX, e.clientY);
                    setColor(color);
                    updateIndicator(e.clientX, e.clientY);
                    e.preventDefault();
                });

                document.addEventListener('mousemove', function(e) {
                    if (!isDraggingGradient) return;
                    var color = getColorFromGradient(e.clientX, e.clientY);
                    setColor(color);
                    updateIndicator(e.clientX, e.clientY);
                });

                document.addEventListener('mouseup', function() {
                    isDraggingGradient = false;
                });

                // 触摸支持（移动端）
                colorGradient.addEventListener('touchstart', function(e) {
                    var touch = e.touches[0];
                    var color = getColorFromGradient(touch.clientX, touch.clientY);
                    setColor(color);
                    updateIndicator(touch.clientX, touch.clientY);
                }, { passive: true });

                colorGradient.addEventListener('touchmove', function(e) {
                    var touch = e.touches[0];
                    var color = getColorFromGradient(touch.clientX, touch.clientY);
                    setColor(color);
                    updateIndicator(touch.clientX, touch.clientY);
                }, { passive: true });
            }

        startInput.addEventListener('click', function() { target = 'start'; });
        endInput.addEventListener('click', function() { target = 'end'; });
        startSwatch.addEventListener('click', function() { startInput.click(); });
        endSwatch.addEventListener('click', function() { endInput.click(); });
        startInput.addEventListener('input', updatePreview);
        endInput.addEventListener('input', updatePreview);
        textInput.addEventListener('input', updatePreview);
        genBtn.addEventListener('click', generate);
        copyBtn.addEventListener('click', function() { var t = resultEl.dataset.result || resultEl.textContent; if (t) Utils.copyText(t).then(function() { Utils.showToast('复制成功'); }); });
        document.querySelectorAll('input[name="color-symbol"], input[name="text-format"]').forEach(function(el) { el.addEventListener('change', updatePreview); });
        updatePreview();
    });

})();
