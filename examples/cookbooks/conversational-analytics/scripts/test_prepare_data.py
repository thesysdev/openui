import unittest
from datetime import datetime

from prepare_data import sales_row


class SalesRowsTest(unittest.TestCase):
    def row(self, invoice="123", quantity=2, price=1.235):
        return (invoice, "A", None, quantity, datetime(2011, 2, 1), price, None, "Germany")

    def test_exclusions(self):
        self.assertEqual(sales_row(self.row(invoice="C123"))[1], "cancellation")
        self.assertEqual(sales_row(self.row(quantity=-1))[1], "non_positive_quantity")
        self.assertEqual(sales_row(self.row(price=0))[1], "non_positive_price")

    def test_missing_customer_and_fractional_penny_price(self):
        row, excluded = sales_row(self.row())
        self.assertIsNone(excluded)
        self.assertEqual(row, ("123", "A", "A", 2, "2011-02-01", "Germany", 24700))


if __name__ == "__main__":
    unittest.main()
