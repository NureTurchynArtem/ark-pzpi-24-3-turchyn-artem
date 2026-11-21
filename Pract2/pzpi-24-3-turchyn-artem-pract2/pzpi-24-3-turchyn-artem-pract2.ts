// До рефакторингу
// backend/src/modules/payments/monobank/payments-monobank.service.ts
// Метод initiatePropertyPayment
let priceNum = parseFloat(String(property.price));
if (Number.isNaN(priceNum) || priceNum <= 0) {
  priceNum = 100; // Fallback for invalid or zero prices
}
let amountInKopecks = Math.round(priceNum * 100);

// Monobank limit for internet acquiring is usually 39,999 UAH per transaction
const MAX_AMOUNT = 3999900;
if (amountInKopecks > MAX_AMOUNT) {
  amountInKopecks = MAX_AMOUNT;
}

const invoiceBody: Record<string, any> = {
  amount: amountInKopecks,
  ccy: 980, // UAH
  // ...
};

// Метод handleWebhookBuyProperty
await this.paymentsService.createPayment({
  amount: amountInKopecks / 100,
  // ...
});

// Після рефакторингу
// backend/src/modules/payments/monobank/monobank.constants.ts
export const KOPECKS_PER_UAH = 100;
export const UAH_CURRENCY_CODE = 980; // ISO 4217 numeric code of UAH
export const FALLBACK_PRICE_UAH = 100;
export const MAX_INVOICE_AMOUNT_UAH = 39_999;
export const MAX_INVOICE_AMOUNT_KOPECKS =
  MAX_INVOICE_AMOUNT_UAH * KOPECKS_PER_UAH;

// backend/src/modules/payments/monobank/payments-monobank.service.ts
// Метод initiatePropertyPayment
let priceNum = parseFloat(String(property.price));
if (Number.isNaN(priceNum) || priceNum <= 0) {
  priceNum = FALLBACK_PRICE_UAH;
}
let amountInKopecks = Math.round(priceNum * KOPECKS_PER_UAH);
if (amountInKopecks > MAX_INVOICE_AMOUNT_KOPECKS) {
  amountInKopecks = MAX_INVOICE_AMOUNT_KOPECKS;
}

const invoiceBody: Record<string, any> = {
  amount: amountInKopecks,
  ccy: UAH_CURRENCY_CODE,
  // ...
};

// Метод handleWebhookBuyProperty
await this.paymentsService.createPayment({
  amount: amountInKopecks / KOPECKS_PER_UAH,
  // ...
});

// До рефакторингу
// frontend/composables/usePaymentNotification.ts
// Функція checkPaymentResult
if (paymentStatus === "success") {
  // ...
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    await fetchUser();

    const activeSub = user.value?.subscription;
    const activeTierName = activeSub?.subscriptionTier?.name?.toLowerCase();

    if (
      activeSub &&
      activeTierName === tier?.toLowerCase() &&
      new Date(activeSub.endDate) > new Date()
    ) {
      isVerified = true;
      break;
    }

    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }
  // ...
} else if (paymentStatus === "failed" || paymentStatus === "cancel") {
  notification.value = {
    type: "error",
    message: "Оплату скасовано або виникла помилка. Спробуйте ще раз.",
  };
}

// Після рефакторингу
// frontend/composables/usePaymentNotification.ts
const hasTier = (sub: UserSubscription, tier?: string): boolean =>
  sub.subscriptionTier?.name?.toLowerCase() === tier?.toLowerCase();

const isNotExpired = (sub: UserSubscription): boolean =>
  new Date(sub.endDate) > new Date();

const isSubscriptionActivated = (
  sub?: UserSubscription | null,
  tier?: string,
): boolean => sub != null && hasTier(sub, tier) && isNotExpired(sub);

const isPaymentCancelled = (status: string): boolean =>
  status === "failed" || status === "cancel";

// Функція checkPaymentResult
if (paymentStatus === "success") {
  // ...
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    await fetchUser();
    if (isSubscriptionActivated(user.value?.subscription, tier)) {
      isVerified = true;
      break;
    }
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }
  // ...
} else if (isPaymentCancelled(paymentStatus)) {
  notification.value = {
    type: "error",
    message: "Оплату скасовано або виникла помилка. Спробуйте ще раз.",
  };
}

// До рефакторингу
// frontend/composables/useStreamVideo.ts
// Функція initVideoClient: обробка вхідних дзвінків
client.state.calls$.subscribe((calls) => {
  const incoming = calls.find(
    (c) =>
      !c.isCreatedByMe && c.state.callingState === CallingState.RINGING,
  );

  if (incoming) {
    activeCall.value = incoming as Call;
    callState.value = "ringing";

    // Listen if caller hangs up before we answer
    incoming.on("call.rejected", () => {
      if (callState.value === "ringing") {
        activeCall.value = null;
        callState.value = "idle";
      }
    });
  } else {
    if (callState.value === "ringing") {
      activeCall.value = null;
      callState.value = "idle";
    }
  }
});

// Після рефакторингу
// frontend/composables/useStreamVideo.ts
const resetRingingCall = () => {
  if (callState.value !== "ringing") return;
  activeCall.value = null;
  callState.value = "idle";
};

// Функція initVideoClient: обробка вхідних дзвінків
client.state.calls$.subscribe((calls) => {
  const incoming = calls.find(
    (c) =>
      !c.isCreatedByMe && c.state.callingState === CallingState.RINGING,
  );
  if (!incoming) {
    resetRingingCall();
    return;
  }

  activeCall.value = incoming as Call;
  callState.value = "ringing";
  // Listen if caller hangs up before we answer
  incoming.on("call.rejected", resetRingingCall);
});
