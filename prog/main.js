/**
 * Получить случайное число в указанном диапазоне
 * @param  {number} min минимальное значение
 * @param  {number} max максимальное значение
 * @return {number} случайное значение
 */
function getRandomNumber(min, max) {
    return min + Math.random() * (max - min);
}

/**
 * @class Класс игрового поля
 * @return {function} конструктор класса
 */
var Gmap = (function(settings) {
    // статические настройки класса
    settings = $.extend(true, {
        /** @type {integer} максимальная высота поля */
        max_height: 200,
        /** @type {integer} максимальная ширина поля */
        max_width: 200,
        /** @type {String} класс целевого контейнера */
        cclass_target: "gmap_container",
        /** @type {String} класс живой клетки */
        cclass_isalive: "isAlive",
        /** @type {integer} размер узла в пикселях */
        node_size: 17,
        /**
         * Функция определения следующего статуса
         * @function
         * @param  {Object} node узел
         * @param  {Array} neighbors набор соседей
         * @return {integer} следующее состояние узла
         */
        cb_nextStatus: function(node, neighbors) {
            var lived = neighbors.filter(function(currentNode) {
                return currentNode.cur;
            }).length;
            node.next = node.cur
                ? (lived == 2 || lived == 3 ? 1 : 0)
                : (lived == 3 ? 1 : 0);
            return node.next;
        }
    }, settings);

    // вернуть конструктор
    return function($target, options) {
        // настройки по умолчанию
        options = $.extend(true, {
            /** @type {integer} текущая высота поля */
            height: "auto",
            /** @type {integer} текущая ширина поля */
            width: "auto",
            /**
             * Функция при изменении статуса узла при клике
             * @function
             * @param  {Object} node узел
             * @param  {integer} index индекс узла
             * @param  {integer} status новый статус узла
             */
            cb_revNodeStatus: function(node, index, status) {
                // do something
            }
        }, options);

        /** @type {jQuery} набор узлов в представлении */
        var $map = null;
        /** @type {Array} набор узлов */
        var map = [];

        // Приватные методы ====================================================
        /**
         * Применить статус к представлению
         * @param  {Object} node узел из набора
         */
        function applyNodeStatus(node) {
            node.$el.toggleClass(settings.cclass_isalive, !!node.cur);
        }

        /**
         * Установить состояние узла
         * @param  {Object} node узел из набора
         * @param  {integer} status статус узла
         * @return {integer} текущий статус узла
         */
        function setNodeStatus(node, status) {
            status = status || 0;
            node.cur = status;
            node.next = status;
            applyNodeStatus(node);
            return node.cur;
        }

        /**
         * Реверсия состояния узла
         * @param  {Object} node узел из набора
         * @return {integer} новый статус узла
         */
        function revNodeStatus(node) {
            var status = node.cur ? 0 : 1;
            return setNodeStatus(node, status);
        }

        /**
         * Получить количество живых клеток
         * @return {integer} количество живых клеток
         */
        function getAliveCount() {
            return map.filter(function(currentNode) {
                return currentNode.cur;
            }).length;
        }

        // Инициализация =======================================================
        // автоматическое определение размеров
        if (options.height === "auto") {
            options.height = Math.floor(($target.height() -5) / settings.node_size);
        }
        if (options.width === "auto") {
            options.width = Math.floor(($target.width() -5) / settings.node_size);
        }
        // проверка граничных условий
        if (options.height > settings.max_height || options.width > settings.max_width) {
            throw "Map size can't be more than max size";
        }

        // обработка контейнера
        $target.empty().toggleClass(settings.cclass_target, true);
        var i, j, max;

        // создание поля
        var html_content = "<table>";
        for (i = 0; i != options.height; i++) {
            html_content += "<tr>";
            for (j = 0; j != options.width; j++) {
                html_content += "<td></td>";
            }
            html_content += "</tr>";
        }
        html_content += "</table>";
        $map = $target.append(html_content).find("td");

        // создание набора узлов
        for (i = 0, max = $map.length; i != max; i++) {
            map.push({
                $el: $map.eq(i),
                cur: 0,
                next: 0,
                nbs: []
            });
        }
        for (i = 0, max = $map.length; i != max; i++) {
            [
                map[i - options.width],
                (i + 1) % options.width != 0 ? map[i - options.width + 1] : undefined,
                (i + 1) % options.width != 0 ? map[i + 1] : undefined,
                (i + 1) % options.width != 0 ? map[i + options.width + 1] : undefined,
                map[i + options.width],
                i % options.width != 0 ? map[i + options.width - 1] : undefined,
                i % options.width != 0 ? map[i - 1] : undefined,
                i % options.width != 0 ? map[i - options.width - 1] : undefined
            ].forEach(function(currentNode) {
                if (typeof currentNode !== "undefined") {
                    map[i].nbs.push(currentNode);
                }
            });
        }

        // Обработчики =========================================================
        $target.delegate("td", "click", function(event) {
            // поиск узла в наборе
            var index = $map.index($(this)),
                node = map[index];
            // новый статус узла
            var status = revNodeStatus(node);
            // вызов колбека
            if (typeof options.cb_revNodeStatus === "function") {
                options.cb_revNodeStatus(node, index, status);
            }
        });

        // Публичные методы ====================================================
        return {
            fn: {
                /**
                 * Получить атрибуты системы
                 * @return {Object} набор атрибутов
                 */
                getAttrs: function() {
                    return {
                        width: options.width,
                        height: options.height
                    }
                },
                /**
                 * Получить текущее состояние системы
                 * @return {Object} состояние
                 */
                getStatus: function() {
                    return {
                        lived: getAliveCount(),
                        capacity: options.height * options.width
                    }
                },
                /**
                 * Очистить карту
                 */
                clearMap: function() {
                    map.forEach(function(currentNode, index) {
                        setNodeStatus(currentNode);
                    });
                },
                /**
                 * Создание карты по заданному алгоритму (исходное состояние)
                 * @param  {Object} algo используемый алгоритм
                 * @return {integer} количество живых клеток
                 */
                createMap: function(algo) {
                    map.forEach(function(currentNode, index) {
                        setNodeStatus(currentNode, algo(currentNode, index));
                    });
                    return getAliveCount();
                },
                /**
                 * Следующий шаг эволюции
                 * @return {integer} количество затронутых клеток
                 */
                nextStep: function() {
                    map.forEach(function(currentNode) {
                        settings.cb_nextStatus(currentNode, currentNode.nbs);
                    });
                    var changed = 0;
                    map.forEach(function(currentNode) {
                        if (currentNode.next != currentNode.cur) {
                            changed++;
                            setNodeStatus(currentNode, currentNode.next);
                        }
                    });
                    return changed;
                },
                /**
                 * Получить набор живых клеток
                 * @return {array} массив индексов живых клеток
                 */
                getLivedNodes: function() {
                    var lived = [];
                    map.forEach(function(currentNode, index) {
                        if (currentNode.cur) {
                            lived.push(index);
                        }
                    });
                    return lived;
                }
            }
        }
    }
})();

/**
 * @class Класс игры
 * @return {function} конструктор класса
 */
var Game = (function(settings) {
    // статические настройки класса
    settings = $.extend(true, {
        /** @type {Object} используемые алгоритмы формирования исходного состояния */
        algos: {
            /**
             * Задается значение состояния клетки
             */
            constant: function(value) {
                return function(currentNode, index) {
                    return value;
                }
            },
            /**
             * Задается вероятность живой клетки
             * @param  {integer} percent вероятность в процентах
             */
            random: function(percent) {
                return function(currentNode, index) {
                    return getRandomNumber(0, 100) <= percent ? 1 : 0;
                }
            },
            /**
             * Задается набор живых узлов
             * @param  {array} set массив индексов
             */
            selection: function(set) {
                return function(currentNode, index) {
                    return set.indexOf(index) != -1 ? 1 : 0;
                }
            }
        }
    }, settings);

    // вернуть конструктор
    return function($target, options) {
        // настройки по умолчанию
        options = $.extend(true, {
            /**
             * Функция обработки результатов на итерации
             * @function
             * @param  {Object} status текущее состояние игры
             */
            cb_useStatus: function(status) {
                // do something
            }
        }, options);

        /** @type {Gmap} экземпляр игрового поля */
        var gmap = Gmap($target, {
            cb_revNodeStatus: function(node, index, status) {
                // счетчик живых узлов
                if (status) state.lived_cur++;
                else state.lived_cur--;
                getExtremes();
                // вызов колбека для обновления информации
                if (typeof options.cb_useStatus === "function") {
                    options.cb_useStatus(getStatus());
                }
            }
        });

        /** @type {Object} реквизиты игры */
        var state = {
            /** @type {Object} используемый алгоритм при создании */
            algo: null,
            /** @type {Array} начальное состояние как набор индексов живых клеток */
            begin: [],
            /** @type {Boolean} запущена или нет */
            isrun: false,
            /** @type {integer} емкость игрового поля */
            capacity: 0,
            /** @type {integer} минимальное число живых клеток */
            lived_min: 0,
            /** @type {integer} максимальное число живых клеток */
            lived_max: 0,
            /** @type {integer} текущее число живых клеток */
            lived_cur: 0,
            /** @type {integer} период шага эволюции (мс) */
            period: 0,
            /** @type {integer} количество пройденных шагов */
            steps_count: 0,
            /** @type {integer} времени прошло (мс) */
            time_passed: 0,
            /** @type {integer} дискриптор таймера */
            timer: null
        };

        // Приватные методы ====================================================
        /**
         * Обновить информацию об экстремумах
         */
        function getExtremes() {
            if (state.lived_cur > state.lived_max) state.lived_max = state.lived_cur;
            else if (state.lived_cur < state.lived_min) state.lived_min = state.lived_cur;
        }

        /**
         * Закрытие игры и обнуление реквизитов
         */
        function closeGame() {
            // если игра запущена, то принудительно остановить
            if (state.isrun) {
                stopGame();
            }
            // очистить игровую карты
            gmap.fn.clearMap();
            // обнулить реквизиты игры
            state.algo = null;
            state.begin = [];
            state.capacity = 0;
            state.lived_min = 0;
            state.lived_max = 0;
            state.lived_cur = 0;
            state.period = 0;
            state.steps_count = 0;
            state.time_passed = 0;
        }

        /**
         * Остановка игры
         */
        function stopGame() {
            clearInterval(state.timer);
            state.isrun = false;
        }

        /**
         * Получить текущий статус игры
         * @return {Object} статус игры
         */
        function getStatus() {
            return {
                capacity: state.capacity,
                lived_min: state.lived_min,
                lived_max: state.lived_max,
                lived_cur: state.lived_cur,
                steps_count: state.steps_count,
                time_passed: state.time_passed,
                isrun: state.isrun
            }
        }

        // Публичные методы ====================================================
        return {
            fn: {
                /**
                 * Закрыть игру
                 * @private
                 */
                closeGame: closeGame,
                /**
                 * Создание новой игры
                 * @param  {Object} algo используемый алгоритм (name, arg)
                 */
                createGame: function(algo) {
                    // закрытие прошлой игры
                    closeGame();
                    // проверка наличия алгоритма формирования начального состояния
                    if (typeof settings.algos[algo.name] === "undefined") {
                        throw "Undefined algorithm for the initial state";
                    }
                    // создание игрового поля
                    gmap.fn.createMap(settings.algos[algo.name](algo.arg));
                    // реквизиты игры
                    var gmap_status = gmap.fn.getStatus();
                    state.algo = algo;
                    state.capacity = gmap_status.capacity;
                    state.lived_cur = state.lived_min = state.lived_max = gmap_status.lived;
                    // колбек обработки статуса
                    if (typeof options.cb_useStatus === "function") {
                        options.cb_useStatus(getStatus());
                    }
                },
                /**
                 * Запуск игры
                 * @param  {integer} period период шага (мс)
                 */
                startGame: function(period) {
                    state.begin = gmap.fn.getLivedNodes();
                    state.period = period;
                    state.timer = setInterval(function() {
                        state.steps_count++;
                        state.time_passed += state.period;
                        // следующий шаг
                        gmap.fn.nextStep();
                        state.lived_cur = gmap.fn.getStatus().lived;
                        getExtremes();
                        // колбек обработки статуса
                        if (typeof options.cb_useStatus === "function") {
                            options.cb_useStatus(getStatus());
                        }
                    }, state.period);
                    state.isrun = true;
                },
                /**
                 * Остановка игры
                 * @private
                 */
                stopGame: stopGame,
                /**
                 * Получить статус игры
                 * @private
                 */
                getStatus: getStatus
            }
        }
    }
})();


$(document).ready(function() {

    /** @type {Object} используемые элементы интерфейса */
    var Int = {
        /** @type {jQuery} целевой контейнер игрового поля */
        $target: $("#map_target"),
        /** @type {jQuery} список выбора алгоритма формирования исходного состояния */
        $control_algo: $("#form_control select[name='algo']"),
        /** @type {jQuery} список возможных периодов */
        $control_period: $("#form_control select[name='period']"),
        /** @type {jQuery} кнопка запуска игры */
        $control_start: $("#form_control button[name='start']"),
        /** @type {jQuery} кнопка остановки игры */
        $control_stop: $("#form_control button[name='stop']"),
        /** @type {jQuery} вывод количества шагов */
        $span_steps: $("#form_status span[name='steps']"),
        /** @type {jQuery} вывод текущей популяции */
        $span_cur: $("#form_status span[name='population']"),
        /** @type {jQuery} вывод минимальной популяции */
        $span_min: $("#form_status span[name='pop_min']"),
        /** @type {jQuery} вывод максимальной популяции */
        $span_max: $("#form_status span[name='pop_max']"),
        // методы
        fn: {
            /**
             * Нормальное представление относительной величины
             * @param  {number} value значение
             * @return {number} нормальное представление
             */
            toPercent: function(value) {
                return (value * 100).toFixed(1);
            }
        }
    };

    /** @type {Game} экземпляр игры */
    var G = Game(Int.$target, {
        cb_useStatus: function(status) {
            Int.$span_steps.text(status.steps_count);
            Int.$span_cur.text(Int.fn.toPercent(status.lived_cur / status.capacity));
            Int.$span_min.text(Int.fn.toPercent(status.lived_min / status.capacity));
            Int.$span_max.text(Int.fn.toPercent(status.lived_max / status.capacity));
        }
    });

    // Выбор алгоритма и создание новой игры
    Int.$control_algo.change(function(event) {
        var $this = $(this),
            $selected = $this.find(":selected"),
            value = $this.val();
        // получить параметры алгоритмы
        var algo = {
            name: value,
            arg: (function(name) {
                switch (name) {
                    case "random": return $selected.attr("data-arg") -0;
                    case "constant": return $selected.attr("data-arg") -0;
                    default: return undefined;
                }
            })(value)
        }
        // создание новой игры
        G.fn.createGame(algo);
    });
    // по умолчанию первый алгоритм
    Int.$control_algo.change();

    // Нажата кнопка запуска игры
    Int.$control_start.click(function(event) {
        // закрыть редактирование параметров
        Int.$control_algo.prop("disabled", true);
        Int.$control_period.prop("disabled", true);
        Int.$control_start.prop("disabled", true);
        Int.$control_stop.prop("disabled", false);
        // запуск игры
        G.fn.startGame(Int.$control_period.val());
    });

    // Нажата кнопка остановки игры
    Int.$control_stop.click(function(event) {
        // открыть редактирование параметров
        Int.$control_algo.prop("disabled", false);
        Int.$control_period.prop("disabled", false);
        Int.$control_start.prop("disabled", false);
        Int.$control_stop.prop("disabled", true);
        // остановка игры
        G.fn.stopGame();
    });

});
