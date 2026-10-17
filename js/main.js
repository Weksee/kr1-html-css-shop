// ===== Модальное окно (есть только на index.html) =====
const orderDialog = document.getElementById('order-dialog');
const orderButtons = document.querySelectorAll('.product-card__button');
const closeDialogButton = document.getElementById('close-order-dialog');
const selectedProductInput = document.getElementById('selected-product');

if (orderDialog) {
  // По клику на «Заказать» записываем товар в скрытое поле и открываем окно
  orderButtons.forEach((button) => {
    button.addEventListener('click', () => {
      selectedProductInput.value = button.dataset.product;
      orderDialog.showModal();
    });
  });

  // Закрытие окна
  closeDialogButton.addEventListener('click', () => {
    orderDialog.close();
  });
}

// ===== Обработка формы (index.html и order.html) =====
const orderForm = document.getElementById('order-form');
const successMessage = document.getElementById('success-message');

if (orderForm) {
  orderForm.addEventListener('submit', (event) => {
    // Отменяем настоящую отправку (backend пока не подключён)
    event.preventDefault();

    // Сбрасываем прошлые пометки ошибок
    const formElements = Array.from(orderForm.elements);

    formElements.forEach((element) => {
      if (element.willValidate) {
        element.removeAttribute('aria-invalid');
      }
    });

    // Проверяем форму и подсвечиваем ошибочные поля
    if (!orderForm.checkValidity()) {
      formElements.forEach((element) => {
        if (element.willValidate && !element.checkValidity()) {
          element.setAttribute('aria-invalid', 'true');
        }
      });

      orderForm.reportValidity();
      return;
    }

    // Успех: сообщение, очистка формы, закрытие окна (если оно есть)
    successMessage.hidden = false;
    orderForm.reset();

    if (orderDialog) {
      orderDialog.close();
    }
  });
}


