ALTER TABLE warehouse_receipts
  ADD COLUMN single_bill_cutoff_date_si varchar(20),
  ADD COLUMN single_bill_gate_closing_time varchar(20),
  ADD COLUMN single_bill_departure_date_e varchar(20),
  ADD COLUMN single_bill_arrival_date_e varchar(20),
  ADD COLUMN single_bill_transit_date_e varchar(20),
  ADD COLUMN single_bill_delivery_date_e varchar(20);
