# Практика 15 — учебный бэкенд на Go (консоль)

Реализует на Go пункт «написать функции для форматирования цены, расчёта скидки, определения статуса товара и формирования краткого описания» и выводит результат в консоль.

Функции (`main.go`): `FormatPrice`, `CalcDiscount`, `GetStatus`, `ShortDescription`.

## Запуск
Нужен установленный Go 1.21+ (https://go.dev/dl/).

    cd backend-go
    go run .            # весь каталог + итоги
    go run . huracan    # один автомобиль (id: sf90, huracan, 750s, 296gtb, huayra, artura, vantage, gt3rs, r8)
    go test             # автотесты функций
