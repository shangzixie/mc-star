export type ReceiptNoSequenceCandidate = {
  prefix: string;
  numericPart: string;
  numericValue: number;
};

export type ReceiptNoSequenceGap = {
  previousReceiptNo: string;
  expectedReceiptNo: string;
};

export function getReceiptNoSequenceCandidate(
  receiptNo: string
): ReceiptNoSequenceCandidate | null {
  const trimmed = receiptNo.trim();
  const match = /^(.*?)(\d+)$/.exec(trimmed);

  if (!match) {
    return null;
  }

  const [, prefix, numericPart] = match;
  return {
    prefix,
    numericPart,
    numericValue: Number.parseInt(numericPart, 10),
  };
}

export function findReceiptNoSequenceGap(params: {
  receiptNo: string;
  existingReceiptNos: string[];
}): ReceiptNoSequenceGap | null {
  const candidate = getReceiptNoSequenceCandidate(params.receiptNo);
  if (!candidate) {
    return null;
  }

  const previous = params.existingReceiptNos
    .map((receiptNo) => ({
      receiptNo,
      candidate: getReceiptNoSequenceCandidate(receiptNo),
    }))
    .filter(
      (
        value
      ): value is {
        receiptNo: string;
        candidate: ReceiptNoSequenceCandidate;
      } =>
        value.candidate !== null &&
        value.candidate.prefix === candidate.prefix &&
        value.candidate.numericPart.length === candidate.numericPart.length
    )
    .sort(
      (left, right) =>
        right.candidate.numericValue - left.candidate.numericValue
    )[0];

  if (!previous) {
    return null;
  }

  const expectedNumericValue = previous.candidate.numericValue + 1;
  const expectedReceiptNo = `${candidate.prefix}${String(
    expectedNumericValue
  ).padStart(candidate.numericPart.length, '0')}`;

  if (candidate.numericValue === expectedNumericValue) {
    return null;
  }

  return {
    previousReceiptNo: previous.receiptNo,
    expectedReceiptNo,
  };
}
