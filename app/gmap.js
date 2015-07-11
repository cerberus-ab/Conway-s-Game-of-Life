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
             * Проверка возможности реверса состояния узла
             * @function
             */
            cb_canRevNodeStatus: function() {
                return true;
            },
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
        /** @type {Array} набор подозрительных клеток */
        var active = [];

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
         * Получить количество живых клеток
         * @return {integer} количество живых клеток
         */
        function getAliveCount() {
            return map.filter(function(currentNode) {
                return currentNode.cur;
            }).length;
        }

        /**
         * Получить набор подозрительных клеток
         * @return {array} набор
         */
        function getActiveNodes() {
            var act = [];
            map.forEach(function(currentNode) {
                if (currentNode.active) act.push(currentNode);
            });
            return act;
        }

        // Инициализация ===================================================
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
                active: false,
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

        // Обработчики =====================================================
        $target.delegate("td", "click", function(event) {
            if (options.cb_canRevNodeStatus()) {
                // поиск узла в наборе
                var index = $map.index($(this)),
                    node = map[index];
                // новый статус узла
                var status = revNodeStatus(node);
                // вызов колбека
                options.cb_revNodeStatus(node, index, status);
            }
        });

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
                    currentNode.active = true;
                });
                // по умолчанию подозрительны все узлы
                active = getActiveNodes();
                // вернуть количество живых
                return getAliveCount();
            },
            /**
             * Следующий шаг эволюции
             * @return {integer} количество затронутых клеток
             */
            nextStep: function() {
                var changed = 0;
                // отменить подозрительность
                map.forEach(function(currentNode) {
                    currentNode.active = false;
                });
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
                        // добавить эту клетку и ее соседей в список подозрительных на следующем шаге
                        currentNode.nbs.concat(currentNode).forEach(function(currentActiveNode) {
                            currentActiveNode.active = true;
                        });
                    }
                });
                // сохранить массив подозрительных клеток
                active = getActiveNodes();
                // вернуть количество затронутых
                return changed;
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
