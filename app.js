// настройки requirejs
require.config({
    baseUrl: "lib",
    paths: {
        app: "../app",
        jquery: "jquery-min",
        config: "../app/config"
    }
});

// главный файл приложения
require(["app/main"]);

