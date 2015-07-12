/**
 * @module Главный модуль приложения
 */
define("app/main", ["jquery", "app/game", "config"], function($, Game, cfg) {

    // После формирования разметки документа
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
            /** @type {jQuery} кнопка сохранения игры */
            $control_save: $("#form_control button[name='save']"),
            /** @type {jQuery} вывод количества шагов */
            $span_steps: $("#form_status span[name='steps']"),
            /** @type {jQuery} вывод значения активных клеток */
            $span_active: $("#form_status span[name='active']"),
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
                },
                /**
                 * Открыть/закрыть доступ к редактированию параметров и управлению
                 * @param  {Boolean} isenable true/false
                 */
                enableForm: function(isenable) {
                    Int.$control_algo.prop("disabled", !isenable);
                    Int.$control_period.prop("disabled", !isenable);
                    Int.$control_start.prop("disabled", !isenable);
                    Int.$control_stop.prop("disabled", isenable);
                    Int.$control_save.prop("disabled", !isenable);
                },
                /**
                 * Формирование представления для алгоритма начального состояния
                 * @param  {Object} data данные
                 * @return {String} разметка нового алгоритма
                 */
                createAlgo: function(data, islocal) {
                    return "<option "
                        + (data.selected ? "selected " : "")
                        + (islocal ? "class='local' " : "")
                        + "value='" + data.algo
                        + "' data-arg='" + (typeof data.arg !== "object" ? data.arg : JSON.stringify(data.arg))
                        + "'>" + data.name
                    + "</option>";
                },
                /**
                 * Формирование представления для режима скорости
                 * @param  {Object} data данные
                 * @return {String} разметка нового режима
                 */
                createSpeedMode: function(data) {
                    return "<option "
                        + (data.selected ? "selected " : "")
                        + "value='" + data.period
                        + "'>" + data.name
                    + "</option>";
                }
            }
        };

        /** @type {Game} экземпляр игры */
        var G = new Game(Int.$target, {
            cb_useStatus: function(status) {
                Int.$span_steps.text(status.steps_count);
                Int.$span_active.text(Int.fn.toPercent(status.active / status.capacity));
                Int.$span_cur.text(Int.fn.toPercent(status.lived_cur / status.capacity));
                Int.$span_min.text(Int.fn.toPercent(status.lived_min / status.capacity));
                Int.$span_max.text(Int.fn.toPercent(status.lived_max / status.capacity));
            }
        });

        // Формирование списка доступных начальных состояний
        Int.$control_algo.append(cfg.istates.map(function(currentState) {
            return Int.fn.createAlgo(currentState);
        }).join(""));

        // Формирование списка доступных режимов скорости
        Int.$control_period.append(cfg.speed.map(function(currentSpeed) {
            return Int.fn.createSpeedMode(currentSpeed);
        }).join(""))

        // Выбор исходного состояния и создание новой игры
        Int.$control_algo.change(function(event) {
            var $this = $(this),
                $selected = $this.find(":selected"),
                value = $this.val();
            // получить параметры алгоритмы
            var algo = {
                name: value,
                arg: (function(name) {
                    switch (name) {
                        case "random":
                        case "constant":
                            return $selected.attr("data-arg") -0;
                        case "selection":
                            return JSON.parse($selected.attr("data-arg"));
                        default:
                            return undefined;
                    }
                })(value)
            }
            // создание новой игры
            G.fn.createGame(algo);
        });
        // первый выбор
        Int.$control_algo.change();

        // Нажата кнопка запуска игры
        Int.$control_start.click(function(event) {
            Int.fn.enableForm(false);
            G.fn.startGame(Int.$control_period.val());
        });

        // Нажата кнопка остановки игры
        Int.$control_stop.click(function(event) {
            Int.fn.enableForm(true);
            G.fn.stopGame();
        });

        // Нажата кнопка сохранение игры
        Int.$control_save.click(function(event) {
            var gsave = G.fn.saveGame();
            if (gsave.name = prompt("Save current system?", "Unnamed system")) {
                var $option = Int.$control_algo.find("option:contains('" + gsave.name + "')");
                if ($option.length) {
                    if (confirm("System already exists. Replace it?")) {
                        $option.val(gsave.algo).attr("data-arg", gsave.arg).toggleClass("local", true);
                    }
                }
                else {
                    Int.$control_algo.append(Int.fn.createAlgo(gsave));
                }
            }
        });

    });

});
