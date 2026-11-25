// Учебный консольный «бэкенд» интернет-магазина WEETY Supercars на Go.
// Реализует те же функции, что и js/main.js на сайте:
// форматирование цены, расчёт скидки, определение статуса и краткое описание.
//
// Запуск:   go run .
// Один авто: go run . huracan
// Тесты:    go test
package main

import (
	"fmt"
	"math"
	"os"
	"strconv"
	"strings"
)

// Product — структура товара (аналог JS-объекта из data.js).
type Product struct {
	ID           string
	Name         string
	Price        int  // цена в рублях
	OldPrice     int  // старая цена, 0 — скидки нет
	InStock      bool // true — в наличии
	Power        string
	Acceleration string
}

// products возвращает каталог автомобилей.
func products() []Product {
	return []Product{
		{ID: "sf90", Name: "Ferrari SF90 Stradale", Price: 65000000, OldPrice: 0, InStock: true, Power: "1000 л.с.", Acceleration: "2,5 с"},
		{ID: "huracan", Name: "Lamborghini Huracán Tecnica", Price: 38000000, OldPrice: 42000000, InStock: true, Power: "640 л.с.", Acceleration: "3,2 с"},
		{ID: "750s", Name: "McLaren 750S", Price: 58000000, OldPrice: 0, InStock: false, Power: "750 л.с.", Acceleration: "2,8 с"},
		{ID: "296gtb", Name: "Ferrari 296 GTB", Price: 41000000, OldPrice: 0, InStock: true, Power: "830 л.с.", Acceleration: "2,9 с"},
		{ID: "huayra", Name: "Pagani Huayra", Price: 220000000, OldPrice: 0, InStock: false, Power: "730 л.с.", Acceleration: "3,3 с"},
		{ID: "artura", Name: "McLaren Artura", Price: 36000000, OldPrice: 39500000, InStock: true, Power: "680 л.с.", Acceleration: "3,0 с"},
		{ID: "vantage", Name: "Aston Martin Vantage", Price: 44000000, OldPrice: 0, InStock: true, Power: "665 л.с.", Acceleration: "3,5 с"},
		{ID: "gt3rs", Name: "Porsche 911 GT3 RS", Price: 48000000, OldPrice: 0, InStock: true, Power: "525 л.с.", Acceleration: "3,2 с"},
		{ID: "r8", Name: "Audi R8 V10 performance", Price: 29000000, OldPrice: 32000000, InStock: true, Power: "620 л.с.", Acceleration: "3,1 с"},
	}
}

// FormatPrice форматирует цену: 65000000 -> "65 000 000 ₽".
func FormatPrice(value int) string {
	s := strconv.Itoa(value)
	negative := strings.HasPrefix(s, "-")
	if negative {
		s = s[1:]
	}
	var b strings.Builder
	for i, ch := range s {
		if i > 0 && (len(s)-i)%3 == 0 {
			b.WriteString(" ")
		}
		b.WriteRune(ch)
	}
	result := b.String() + " ₽"
	if negative {
		result = "-" + result
	}
	return result
}

// CalcDiscount считает скидку в процентах (арифметические операторы).
func CalcDiscount(price, oldPrice int) int {
	if oldPrice <= 0 || oldPrice <= price {
		return 0
	}
	return int(math.Round(float64(oldPrice-price) / float64(oldPrice) * 100))
}

// GetStatus определяет статус товара (сравнения и логические операторы).
func GetStatus(p Product) string {
	hasDiscount := CalcDiscount(p.Price, p.OldPrice) > 0
	if p.InStock && hasDiscount {
		return "В наличии, действует скидка"
	}
	if p.InStock {
		return "В наличии"
	}
	return "Под заказ"
}

// ShortDescription формирует краткое описание товара.
func ShortDescription(p Product) string {
	return fmt.Sprintf("%s — %s, разгон 0–100 за %s. %s.", p.Name, p.Power, p.Acceleration, GetStatus(p))
}

// findProduct ищет товар по id.
func findProduct(list []Product, id string) (Product, bool) {
	for _, p := range list {
		if p.ID == id {
			return p, true
		}
	}
	return Product{}, false
}

// printProduct выводит подробную информацию об одном товаре в консоль.
func printProduct(p Product) {
	fmt.Println("Название:    ", p.Name)
	fmt.Println("Цена:        ", FormatPrice(p.Price))
	if d := CalcDiscount(p.Price, p.OldPrice); d > 0 {
		fmt.Printf("Скидка:       %d%% (было %s)\n", d, FormatPrice(p.OldPrice))
	}
	fmt.Println("Статус:      ", GetStatus(p))
	fmt.Println("Описание:    ", ShortDescription(p))
}

func main() {
	list := products()

	// Режим «один автомобиль»: go run . huracan
	if len(os.Args) > 1 {
		p, ok := findProduct(list, os.Args[1])
		if !ok {
			fmt.Printf("Автомобиль с id %q не найден. Доступные id:\n", os.Args[1])
			for _, item := range list {
				fmt.Println(" -", item.ID)
			}
			os.Exit(1)
		}
		printProduct(p)
		return
	}

	line := strings.Repeat("=", 78)
	fmt.Println(line)
	fmt.Println("WEETY Supercars — учебный консольный бэкенд (Go)")
	fmt.Println(line)

	total, inStock, withDiscount := 0, 0, 0
	best := list[0]
	for i, p := range list {
		fmt.Printf("%d. %s\n", i+1, ShortDescription(p))
		fmt.Printf("   Цена: %s", FormatPrice(p.Price))
		if d := CalcDiscount(p.Price, p.OldPrice); d > 0 {
			fmt.Printf("  (скидка %d%%, было %s)", d, FormatPrice(p.OldPrice))
			withDiscount++
		}
		fmt.Println()

		total += p.Price
		if p.InStock {
			inStock++
		}
		if p.Price > best.Price {
			best = p
		}
	}

	fmt.Println(line)
	fmt.Println("Итоги каталога")
	fmt.Println("Всего моделей:       ", len(list))
	fmt.Println("В наличии:           ", inStock)
	fmt.Println("Со скидкой:          ", withDiscount)
	fmt.Println("Средняя цена:        ", FormatPrice(total/len(list)))
	fmt.Println("Самый дорогой:       ", best.Name, "—", FormatPrice(best.Price))
	fmt.Println(line)
}
