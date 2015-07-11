// настройки requirejs
require.config({
    baseUrl: "lib",
    paths: {
        app: "../app",
        jquery: "jquery-min"
    }
});

// главный файл приложения
require(["app/main"]);

