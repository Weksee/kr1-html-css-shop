package main

import "testing"

func TestFormatPrice(t *testing.T) {
	cases := map[int]string{
		0:        "0 ₽",
		950:      "950 ₽",
		65000000: "65 000 000 ₽",
		1234567:  "1 234 567 ₽",
	}
	for in, want := range cases {
		if got := FormatPrice(in); got != want {
			t.Errorf("FormatPrice(%d) = %q, want %q", in, got, want)
		}
	}
}

func TestCalcDiscount(t *testing.T) {
	if got := CalcDiscount(38000000, 42000000); got != 10 {
		t.Errorf("скидка Huracán = %d, want 10", got)
	}
	if got := CalcDiscount(100, 0); got != 0 {
		t.Errorf("без старой цены скидка = %d, want 0", got)
	}
	if got := CalcDiscount(200, 100); got != 0 {
		t.Errorf("старая цена ниже новой: скидка = %d, want 0", got)
	}
}

func TestGetStatus(t *testing.T) {
	cases := []struct {
		p    Product
		want string
	}{
		{Product{InStock: true, Price: 90, OldPrice: 100}, "В наличии, действует скидка"},
		{Product{InStock: true, Price: 100}, "В наличии"},
		{Product{InStock: false, Price: 100}, "Под заказ"},
	}
	for _, c := range cases {
		if got := GetStatus(c.p); got != c.want {
			t.Errorf("GetStatus(%+v) = %q, want %q", c.p, got, c.want)
		}
	}
}

func TestShortDescription(t *testing.T) {
	p, ok := findProduct(products(), "sf90")
	if !ok {
		t.Fatal("sf90 не найден")
	}
	want := "Ferrari SF90 Stradale — 1000 л.с., разгон 0–100 за 2,5 с. В наличии."
	if got := ShortDescription(p); got != want {
		t.Errorf("got %q, want %q", got, want)
	}
}
