/**
 * @module Общие базовые функции
 * @return {Object} набор функций (fn)
 */
define("app/basic", {

    fn: {
        /**
         * Получить случайное число в указанном диапазоне
         * @param  {number} min минимальное значение
         * @param  {number} max максимальное значение
         * @return {number} случайное значение
         */
        getRandomNumber(min, max) {
            return min + Math.random() * (max - min);
        }
    }
});
