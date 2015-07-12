/**
 * @module Фабрика клеток игрового поля
 * @return {function} конструктор фабрики клеток
 */
define("app/gnode", ["jquery"], function($) {

    return function(settings) {
        // настройки фабрики
        settings = $.extend(true, {
            /** @type {String} используемый тэг */
            tag: "TD",
            /** @type {String} класс живой клетки */
            cclass_isalive: "isAlive",
            /** @type {String} класс активной клетки */
            cclass_isactive: "isActive",
            /** @type {integer} размер клетки в пикселях */
            node_size: 17,
            /**
             * Функция определения следующего состояния клетки
             * @function
             * @this   {Gnode} клетка
             * @return {integer} следующее состояние клетки
             */
            cb_nextAliveStatus: function() {
                var lived = this.nbs.filter(function(currentNode) {
                    return currentNode.cur;
                }).length;
                this.next = this.cur
                    ? (lived == 2 || lived == 3 ? 1 : 0)
                    : (lived == 3 ? 1 : 0);
                return this.next;
            }
        }, settings);

        /**
         * Класс клетки игрового поля
         * @param {jQuery} $el элемент представления
         * @param {integer} status состояние клетки по умолчанию
         */
        function createNode($el, status) {
            // параметры по умолчанию
            this.$el = $el;
            this.next = this.cur = 0;
            this.active = false;
            this.nbs = [];
            // применить состояние клетки
            if (typeof status !== "undefined" && status !== this.cur) {
                this.setAliveStatus(status);
            }
        }

        /**
         * Статические свойства конструктора
         * @type {Object}
         */
        createNode.prototype.cfg = {
            /** @type {integer} размер клетки в пикселях */
            size: settings.node_size,
            /** @type {String} используемый тэг */
            tagName: settings.tag
        };

        /**
         * Функция определения следующего состояния узла
         * @return {integer} установленное следующее состояние
         */
        createNode.prototype.nextAliveStatus = function() {
            return settings.cb_nextAliveStatus.call(this);
        };

        /**
         * Применить состояние клетки к ее представлению
         */
        createNode.prototype.applyAliveStatus = function() {
            this.$el.toggleClass(settings.cclass_isalive, !!this.cur);
        };

        /**
         * Применить активность клетки к ее представлению
         */
        createNode.prototype.applyActiveStatus = function() {
            this.$el.toggleClass(settings.cclass_isactive, this.active);
        };

        /**
         * Установить состояние клетки
         * @param  {integer} status новое состояние
         * @return {integer} установленное состояние
         */
        createNode.prototype.setAliveStatus = function(status) {
            this.next = this.cur = status || 0;
            this.applyAliveStatus();
            return this.cur;
        };

        /**
         * Реверс состояния клетки
         * @return {integer} установленное состояние
         */
        createNode.prototype.revAliveStatus = function() {
            return this.setAliveStatus(this.cur ? 0 : 1);
        };

        /**
         * Установить активность клетки
         * @param  {Boolean} status новая активность
         * @return {Boolean} установленная активность
         */
        createNode.prototype.setActiveStatus = function(status) {
            this.active = !!status;
            this.applyActiveStatus();
            return this.active;
        };

        /**
         * Установить соседей клетки
         * @param  {array} nbs набор клеток соседей
         * @return {integer} число действительный соседей
         */
        createNode.prototype.setNeighbors = function(nbs) {
            var node = this;
            node.nbs = [];
            nbs.forEach(function(currentNode) {
                if (typeof currentNode !== "undefined") {
                    node.nbs.push(currentNode);
                }
            });
            return node.nbs.length;
        };

        // вернуть конструктор
        return createNode;
    }
});
