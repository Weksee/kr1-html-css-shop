// ===== Модальное окно =====

// Модальное окно
const orderDialog = document.getElementById('order-dialog');

// Все кнопки «Заказать»
const orderButtons = document.querySelectorAll('.product-card__button');

// Кнопка «Закрыть»
const closeDialogButton = document.getElementById('close-order-dialog');

// Скрытое поле для выбранного товара
const selectedProductInput = document.getElementById('selected-product');

// По клику на «Заказать» записываем товар в скрытое поле и открываем окно
orderButtons.forEach((button) => {
  button.addEventListener('click', () => {
    const productName = button.dataset.product;
    selectedProductInput.value = productName;
    orderDialog.showModal();
  });
});

// Закрытие окна
closeDialogButton.addEventListener('click', () => {
  orderDialog.close();
});

// ===== Обработка формы =====

const orderForm = document.getElementById('order-form');
const successMessage = document.getElementById('success-message');

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

  // Проверяем форму
  if (!orderForm.checkValidity()) {
    formElements.forEach((element) => {
      if (element.willValidate && !element.checkValidity()) {
        element.setAttribute('aria-invalid', 'true');
      }
    });

    orderForm.reportValidity();
    return;
  }

  // Успех: показываем сообщение, очищаем форму, закрываем окно
  successMessage.hidden = false;
  orderForm.reset();
  orderDialog.close();
});