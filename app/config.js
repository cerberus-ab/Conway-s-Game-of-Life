/**
 * @module Модуль конфигурации приложения
 * @return {Object} конфигурация
 */
define("config", {

    /** @type {Object} настройки приложения */
    app: {
        /** @type {Boolean} режим разработки */
        develop: true
    },
    /** @type {Array} доступные исходные состояния */
    istates: [
        // constant
        {
            name: "Empty",
            algo: "constant",
            arg: 0,
            selected: true
        },
        // random
        {
            name: "5% Population",
            algo: "random",
            arg: 5
        },
        {
            name: "20% Population",
            algo: "random",
            arg: 20
        },
        {
            name: "50% Population",
            algo: "random",
            arg: 50
        },
        {
            name: "80% Population",
            algo: "random",
            arg: 80
        },
        {
            name: "95% Population",
            algo: "random",
            arg: 95
        },
        // selection
        {
            name: "Kok's galaxy",
            algo: "selection",
            arg: [[3,3],[4,3],[5,3],[6,3],[7,3],[8,3],[10,3],[11,3],[3,4],[4,4],[5,4],[6,4],[7,4],[8,4],[10,4],[11,4],[10,5],[11,5],[3,6],[4,6],[10,6],[11,6],[3,7],[4,7],[10,7],[11,7],[3,8],[4,8],[10,8],[11,8],[3,9],[4,9],[3,10],[4,10],[6,10],[7,10],[8,10],[9,10],[10,10],[11,10],[3,11],[4,11],[6,11],[7,11],[8,11],[9,11],[10,11],[11,11]]
        },
        {
            name: "Cheshire cat",
            algo: "selection",
            arg: [[4,3],[7,3],[4,4],[5,4],[6,4],[7,4],[3,5],[8,5],[3,6],[5,6],[6,6],[8,6],[3,7],[8,7],[4,8],[5,8],[6,8],[7,8]]
        },
        {
            name: "Gosper glider gun",
            algo: "selection",
            arg: [[1,5],[2,5],[1,6],[2,6],[11,5],[11,6],[11,7],[12,4],[12,8],[13,3],[13,9],[14,3],[14,9],[15,6],[16,4],[16,8],[17,5],[17,6],[17,7],[18,6],[21,5],[21,4],[21,3],[22,5],[22,4],[22,3],[23,2],[23,6],[25,2],[25,1],[25,6],[25,7],[35,3],[35,4],[36,3],[36,4]]
        },
    ],
    /** @type {Array} доступные режимы скорости */
    speed: [
        {
            name: "Very slow",
            period: 5000
        },
        {
            name: "Slow",
            period: 1500
        },
        {
            name: "Middle",
            period: 400,
            selected: true
        },
        {
            name: "Fast",
            period: 100
        },
        {
            name: "Very fast",
            period: 20
        }
    ]
});
