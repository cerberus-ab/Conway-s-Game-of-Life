/**
 * @module Класс игры
 * @return {function} конструктор класса
 */
define("app/game", ["jquery", "app/gmap", "app/basic"], function($, Gmap, Basic) {

    // статические настройки класса
    var settings = {
        /** @type {Object} используемые алгоритмы формирования исходного состояния */
        algos: {
            /**
             * Задается значение состояния клетки
             * @this   {Gmap} используемая карта
             * @param  {integer} value значение состояния
             */
            constant: function(value) {
                return function(currentNode, index) {
                    return value;
                }
            },
            /**
             * Задается вероятность живой клетки
             * @this   {Gmap} используемая карта
             * @param  {integer} percent вероятность в процентах
             */
            random: function(percent) {
                return function(currentNode, index) {
                    return Basic.fn.getRandomNumber(0, 100) <= percent ? 1 : 0;
                }
            },
            /**
             * Задается набор живых узлов
             * @this   {Gmap} используемая карта
             * @param  {array} set массив индексов [x,y]
             */
            selection: function(set) {
                var gmap = this;
                set = set.map(function(currentCo) {
                    return gmap.fn.getAbsCo(currentCo);
                });
                return function(currentNode, index) {
                    return set.indexOf(index) < 0 ? 0 : 1;
                }
            }
        }
    }

    // вернуть конструктор
    return function($target, options) {
        // настройки по умолчанию
        options = $.extend(true, {
            /** @type {integer|auto} ширина игрового поля */
            width: "auto",
            /** @type {integer|auto} высота игрового поля */
            height: "auto",
            /**
             * Функция при инициализации игры
             * @function
             * @param  {Object} attrs атрибуты игры
             */
            cb_initGame: function(attrs) {
                // do nothing
            },
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
        var gmap = new Gmap($target, {
            width: options.width,
            height: options.height,
            cb_canSelected: function() {
                return !state.isrun;
            },
            cb_acceptSelected: function(gmap_status) {
                // счетчик живых узлов
                state.lived_cur = gmap_status.count_alive;
                getExtremes();
                state.active = gmap_status.count_active;
                // вызов колбека для обновления информации
                options.cb_useStatus(getStatus());
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
            /** @type {integer} количество активных клеток */
            active: 0,
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
                active: state.active,
                capacity: state.capacity,
                lived_min: state.lived_min,
                lived_max: state.lived_max,
                lived_cur: state.lived_cur,
                steps_count: state.steps_count,
                time_passed: state.time_passed,
                isrun: state.isrun
            }
        }

        // Инициализация =======================================================
        // вызов колбэка
        options.cb_initGame({
            gmap: gmap.fn.getAttrs()
        });

        // Публичные методы ====================================================
        this.fn = {
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
                var gmap_state = gmap.fn.createMap(settings.algos[algo.name].call(gmap, algo.arg));
                // реквизиты игры
                state.algo = algo;
                state.capacity = gmap_state.capacity;
                state.lived_cur = state.lived_min = state.lived_max = gmap_state.count_alive;
                state.active = gmap_state.count_active;
                // колбек обработки статуса
                options.cb_useStatus(getStatus());
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
                    var gmap_state = gmap.fn.nextStep();
                    state.lived_cur = gmap_state.count_alive;
                    state.active = gmap_state.count_active;
                    getExtremes();
                    // колбек обработки статуса
                    options.cb_useStatus(getStatus());
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
            getStatus: getStatus,
            /**
             * Сохранить игру (текущую карту)
             * @return {Object} параметры игры
             */
            saveGame: function() {
                return {
                    algo: "selection",
                    arg: JSON.stringify(gmap.fn.getLivedNodes(true))
                }
            }
        }
    }
});
