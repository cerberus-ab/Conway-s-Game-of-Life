/**
 * @module Класс игрового поля
 * @return {function} конструктор класса
 */
define("app/gmap", ["jquery"], function($) {

    // статические настройки класса
    var settings = {
        /** @type {integer} максимальная высота поля */
        max_height: 200,
        /** @type {integer} максимальная ширина поля */
        max_width: 200,
        /** @type {String} класс целевого контейнера */
        cclass_target: "gmap_container",
        /** @type {String} класс живой клетки */
        cclass_isalive: "isAlive",
        /** @type {String} класс подозрительной клетки */
        cclass_isactive: "isActive",
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
    };

    // вернуть конструктор
    return function($target, options) {
        // настройки по умолчанию
        options = $.extend(true, {
            /** @type {integer} текущая высота поля */
            height: "auto",
            /** @type {integer} текущая ширина поля */
            width: "auto",
            /**
             * Проверка возможности выбора клеток
             * @function
             */
            cb_canSelected: function() {
                return true;
            },
            /**
             * Функция при принятии выбора узлов
             * @function
             * @param  {Object} gmap_status состояние карты
             */
            cb_acceptSelected: function(gmap_status) {
                // do something
            }
        }, options);

        /** @type {jQuery} набор узлов в представлении */
        var $map = null;
        /** @type {Array} набор узлов */
        var map = [];
        /** @type {Array} набор подозрительных клеток */
        var active = [];

        /** @type {Object} статус игрового поля */
        var state = {
            /** @type {integer} количество живых клеток */
            count_alive: 0,
            /** @type {integer} количество активных клеток */
            count_active: 0,
            /** @type {integer} изменилось клеток (по предыдущему шагу) */
            count_changed: 0,
            /** @type {integer} общее количество клеток */
            capacity: 0
        };

        // Приватные методы ================================================
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
         * Получить набор подозрительных клеток
         * @return {integer} количество активных клеток
         */
        function getActiveNodes() {
            // отменить подозрительность для всех клеток
            map.forEach(function(currentNode) {
                currentNode.active = false;
            });
            // подозрительны живые клетки и их соседи
            map.forEach(function(currentNode) {
                if (currentNode.cur) {
                    currentNode.nbs.concat(currentNode).forEach(function(currentActiveNode) {
                        currentActiveNode.active = true;
                    });
                }
            });
            // фомрирование набора подозрительных клеток
            active = [];
            map.forEach(function(currentNode) {
                currentNode.$el.toggleClass(settings.cclass_isactive, currentNode.active);
                if (currentNode.active) {
                    active.push(currentNode);
                }
            });
            // вернуть количество
            return active.length;
        }

        /**
         * Получить клетку по представлению
         * @param  {jQuery} $node представление
         * @return {Object} клетка
         */
        function findNodeByView($node) {
            return map[$map.index($node)];
        }

        /**
         * Обновить информацию о состоянии системы
         * @return {Object} текущее состояние системы
         */
        function updateState() {
            state.count_alive = map.filter(function(currentNode) {
                return currentNode.cur;
            }).length;
            state.count_active = map.filter(function(currentNode) {
                return currentNode.active;
            }).length;;
            return state;
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
        // сохранить общее количество в объект состояния
        state.capacity = options.width * options.height;

        // обработка контейнера
        $target.empty().toggleClass(settings.cclass_target, true);
        var i, j;

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
        var max = $map.length;
        for (i = 0; i != max; i++) {
            map.push({
                active: false,
                $el: $map.eq(i),
                cur: 0,
                next: 0,
                nbs: []
            });
        }
        for (i = 0; i != max; i++) {
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

        // Обработчики =====================================================
        // Выбор клеток игрового поля
        ;(function() {
            /** @type {Boolean} вкл/выкл выбор клеток */
            var curve = false;
            // Начало выбор: зажата кнопка мыши на игровом поле
            $target.on("mousedown", function(event) {
                if (options.cb_canSelected()) {
                    curve = true;
                    if (event.target.tagName == "TD") {
                        revNodeStatus(findNodeByView($(event.target)));
                    }
                }
            });
            // Заверешение выбора: кнопка отжата или курсор покинул поле
            $target.on("mouseup mouseleave", function(event) {
                curve = false;
                // обновить список активных клеток
                getActiveNodes();
                // обновить состояние системы
                var gmap_state = updateState();
                // вызов колбэка
                options.cb_acceptSelected(gmap_state);
            });
            // Реверс состояния целевой клетки
            $target.delegate("TD", "mouseenter", function(event) {
                if (curve) {
                    revNodeStatus(findNodeByView($(this)));
                }
            });
        })();

        // Публичные методы ================================================
        this.fn = {
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
             * @return {Object} состояние системы
             */
            getStatus: function() {
                return state;
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
             * @return {Object} состояние карты
             */
            createMap: function(algo) {
                map.forEach(function(currentNode, index) {
                    setNodeStatus(currentNode, algo(currentNode, index));
                });
                getActiveNodes();
                // вернуть состояние
                return updateState();
            },
            /**
             * Следующий шаг эволюции
             * @return {Object} состояние карты
             */
            nextStep: function() {
                var changed = 0;
                // определение нового статуса
                active.forEach(function(currentNode) {
                    settings.cb_nextStatus(currentNode, currentNode.nbs);
                });
                // применить новый статус
                active.forEach(function(currentNode) {
                    // если статус изменился
                    if (currentNode.next !== currentNode.cur) {
                        // применить новый статус для текущей клетки
                        changed++;
                        setNodeStatus(currentNode, currentNode.next);
                    }
                });
                // сохранить массив подозрительных клеток
                getActiveNodes();
                // вернуть состояние
                state.count_changed = changed;
                return updateState();
            },
            /**
             * Получить набор живых клеток
             * @param  {Boolean} isrel относительные координаты (Default: false)
             * @return {array} массив индексов живых клеток
             */
            getLivedNodes: function(isrel) {
                var lived = [];
                map.forEach(function(currentNode, index) {
                    if (currentNode.cur) {
                        lived.push(!isrel ? index : [index % options.width, Math.floor(index / options.width)]);
                    }
                });
                return lived;
            },
            /**
             * Получить абсолютную координату по относительной (дек)
             * @param  {array} relco координата x,y
             * @return {arry} координата ax
             */
            getAbsCo: function(xy) {
                var ax = xy[1] * options.width + xy[0];
                return ax < options.height * options.width ? ax : undefined;
            }
        }
    }
});
