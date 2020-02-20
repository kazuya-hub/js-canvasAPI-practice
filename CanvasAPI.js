'use strict';

(async () => {
    const CANVAS_WIDTH = 640;
    const CANVAS_HEIGHT = 480;
    const DEFAULT_RADIUS = 200;

    const canvas_center_x = CANVAS_WIDTH / 2;
    const canvas_center_y = CANVAS_HEIGHT / 2;


    const FPS = 60;
    /** 回転の速さ 度/秒 */
    const DEFAULT_ROTATION_SPEED = 60;


    /** @type {HTMLCanvasElement} */
    const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = CANVAS_WIDTH;
    canvas.height = CANVAS_HEIGHT;
    ctx.font = 'italic 14px Times New Roman';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    /** @type {HTMLSpanElement} */
    const degree_display_Element = document.getElementById('degree');
    /** @type {HTMLSpanElement} */
    const sin_display_Element = document.getElementById('sin');
    /** @type {HTMLSpanElement} */
    const cos_display_Element = document.getElementById('cos');


    let degree = 0;

    /** @type {HTMLInputElement} */
    const degree_range_display_Element = document.getElementById('degree-range');
    /** @type {HTMLInputElement} */
    const sin_range_display_Element = document.getElementById('sin-range');
    /** @type {HTMLInputElement} */
    const cos_range_display_Element = document.getElementById('cos-range');

    /**
     * 角度を変更し、update()を呼び出す
     * @param {number} degree_to_set 
     */
    function modifyDegree(degree_to_set) {
        degree = degree_to_set;
        update();
    }
    degree_range_display_Element.addEventListener('input', event => {
        modifyDegree(Number(degree_range_display_Element.value) || 0);
    });
    sin_range_display_Element.addEventListener('input', event => {
        const radian = Math.asin(Number(sin_range_display_Element.value));
        const degree_to_set = radian * 180 / Math.PI;
        modifyDegree(degree_to_set);
    });
    cos_range_display_Element.addEventListener('input', event => {
        const radian = Math.acos(Number(cos_range_display_Element.value));
        const degree_to_set = radian * 180 / Math.PI;
        modifyDegree(degree_to_set);
    });

    /** @type {HTMLInputElement} input[type="range"] */
    const radius_input_Element = document.getElementById('radius');
    radius_input_Element.min = 0;
    radius_input_Element.max = Math.max(CANVAS_WIDTH, CANVAS_HEIGHT);
    let radius = radius_input_Element.value = DEFAULT_RADIUS;
    radius_input_Element.addEventListener('input', event => {
        radius = Number(radius_input_Element.value) || 0;
        updateOffScreenCanvas();
    });

    const rotation_speed_input_Element = document.getElementById('rotation-speed');
    let rotation_speed = rotation_speed_input_Element.value = DEFAULT_ROTATION_SPEED;
    let step = 0;
    function modifyStep() {
        step = rotation_speed / FPS;
    }
    modifyStep();
    rotation_speed_input_Element.addEventListener('input', event => {
        rotation_speed = Number(rotation_speed_input_Element.value) || 0;
        modifyStep();
    });

    /** @type {HTMLButtonElement} */
    const pause_button = document.getElementById('pause-button');


    /**
     * 更新頻度が低い部分を描くキャンバス
     */
    const offScreen_canvas = new OffscreenCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
    const offScreen_canvas_ctx = offScreen_canvas.getContext('2d');
    function updateOffScreenCanvas() {
        offScreen_canvas_ctx.clearRect(0, 0, offScreen_canvas.width, offScreen_canvas.height);
        // 円
        offScreen_canvas_ctx.beginPath();
        offScreen_canvas_ctx.arc(canvas_center_x, canvas_center_y, radius, 0, Math.PI * 2);
        offScreen_canvas_ctx.closePath();
        offScreen_canvas_ctx.stroke();
        // 十時線
        offScreen_canvas_ctx.beginPath();
        offScreen_canvas_ctx.moveTo(0, canvas_center_y);
        offScreen_canvas_ctx.lineTo(CANVAS_WIDTH, canvas_center_y);
        offScreen_canvas_ctx.moveTo(canvas_center_x, 0);
        offScreen_canvas_ctx.lineTo(canvas_center_x, CANVAS_HEIGHT);
        offScreen_canvas_ctx.stroke();
    }
    updateOffScreenCanvas();




    function update() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const radian = degree / 180 * Math.PI;

        const sin = Math.sin(radian);
        const cos = Math.cos(radian);

        const right_triangle_width = radius * cos;
        const right_triangle_height = radius * sin;

        // canvas外
        degree_display_Element.innerText = `${degree.toFixed(6)}°`;
        degree_range_display_Element.value = degree;
        sin_display_Element.innerText = sin.toFixed(12);
        sin_range_display_Element.value = sin;
        cos_display_Element.innerText = cos.toFixed(12);
        cos_range_display_Element.value = cos;

        // 円と十時線
        ctx.drawImage(offScreen_canvas, 0, 0);
        // rの線
        ctx.beginPath();
        ctx.moveTo(canvas_center_x, canvas_center_y);
        ctx.lineTo(canvas_center_x + right_triangle_width, canvas_center_y - right_triangle_height);
        ctx.closePath();
        ctx.stroke();
        // 破線
        (() => {
            ctx.setLineDash([8, 8]);
            // X軸から点Pまでの破線
            (() => {
                ctx.beginPath();
                ctx.moveTo(canvas_center_x + right_triangle_width, canvas_center_y);
                ctx.lineTo(canvas_center_x + right_triangle_width, canvas_center_y - right_triangle_height);
                ctx.stroke();
            })();
            // Y軸から点Pまでの破線
            (() => {
                ctx.beginPath();
                ctx.moveTo(canvas_center_x, canvas_center_y - right_triangle_height);
                ctx.lineTo(canvas_center_x + right_triangle_width, canvas_center_y - right_triangle_height);
                ctx.stroke();
            })();
            ctx.setLineDash([]);
        })();
        // 角度の弧
        (() => {
            ctx.fillStyle = 'rgba(255, 255, 0, 0.2)';
            ctx.beginPath();

            /*
            CanvasRenderingContext2D.arc()メソッドはstartAngleとendAngleを
            x軸の正方向から時計回りに定められるラジアン角で受け取るのに対し、
            このプログラムでは角度をx軸の正方向から反時計回りに定めているため、
            0°の時と360°の時に描くべき扇が逆になってしまう
            それを回避するため、0°の時と360°の時のみ特別に処理を分けている
            */
            if (degree === 0) {
                // 描く必要無し
            } else if (degree === 360) {
                // 一周
                ctx.arc(canvas_center_x, canvas_center_y, radius / 6, 0, 2 * Math.PI, true);
            } else {
                ctx.arc(canvas_center_x, canvas_center_y, radius / 6, 0, 2 * Math.PI - radian, true);
            }

            ctx.lineTo(canvas_center_x, canvas_center_y);
            ctx.stroke();
            ctx.fill();
            ctx.fillStyle = '#000000';
        })();
        // rの文字
        (() => {
            const radian = (degree + 8) / 180 * Math.PI;
            const x = canvas_center_x + (radius / 2) * Math.cos(radian);
            const y = canvas_center_y - (radius / 2) * Math.sin(radian);
            ctx.fillText('r', x, y);
        })();
        // 角度の文字
        (() => {
            const radian = (degree / 2) / 180 * Math.PI;
            const x = canvas_center_x + (radius / 4) * Math.cos(radian);
            const y = canvas_center_y - (radius / 4) * Math.sin(radian);
            ctx.fillText(`${degree.toFixed(1)}°`, x, y);
        })();
        // 点P
        (() => {
            const x = canvas_center_x + (radius) * Math.cos(radian);
            const y = canvas_center_y - (radius) * Math.sin(radian);
            ctx.beginPath();
            ctx.arc(x, y, 2.5, 0, 2 * Math.PI);
            ctx.fill();
        })();
        // Pの文字
        (() => {
            const x = canvas_center_x + (radius + 20) * Math.cos(radian);
            const y = canvas_center_y - (radius + 20) * Math.sin(radian);
            ctx.fillText('P(x, y)', x, y);
        })();
        // xの文字
        (() => {
            const x = canvas_center_x + right_triangle_width;
            const y =
                (right_triangle_height >= 0) ?
                    canvas_center_y + 8 :
                    canvas_center_y - 8;
            ctx.fillText('x', x, y);
        })();
        // yの文字
        (() => {
            const x =
                (right_triangle_width >= 0) ?
                    canvas_center_x - 8 :
                    canvas_center_x + 8;
            const y = canvas_center_y - right_triangle_height;
            ctx.fillText('y', x, y);
        })();
    }
    radius_input_Element.addEventListener('input', event => {
        update();
    });

    // ループに使うsetIntervalのid ループ中では無い場合はnull
    let loop_intervalId = null;
    function startLoop() {
        loop_intervalId = setInterval(() => {
            // console.log(degree)
            modifyDegree((degree + step) % 360);
        }, 1000 / FPS);
        pause_button.innerText = '一時停止';
    }
    function stopLoop() {
        if (loop_intervalId === null) {
            return;
        }
        clearInterval(loop_intervalId);
        loop_intervalId = null;
        pause_button.innerText = 'リスタート';
    }

    pause_button.onclick = event => {
        if (loop_intervalId === null) {
            startLoop();
        } else {
            stopLoop();
        }
    };
    startLoop();
})();
