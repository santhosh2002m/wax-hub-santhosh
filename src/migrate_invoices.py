import pandas as pd
from datetime import datetime
import os
from sqlalchemy import create_engine

class ExcelToSQLMigrator:
    def __init__(self, excel_file_path, db_connection_string):
        self.excel_file_path = excel_file_path
        self.db_connection_string = db_connection_string
        self.ticket_mappings = {}
        self.counter_mappings = {}
        self.next_ticket_id = 1
        self.next_counter_id = 14  # Start from 14 since you have counters 1-13
    
    def get_existing_counters(self):
        """Get existing counters from database to avoid duplicates"""
        try:
            engine = create_engine(self.db_connection_string)
            counters_query = "SELECT id, username FROM counters;"
            counters_df = pd.read_sql(counters_query, engine)
            
            print("=== EXISTING DATABASE COUNTERS ===")
            for _, row in counters_df.iterrows():
                counter_id = row['id']
                username = str(row['username']).strip().lower()
                self.counter_mappings[username] = counter_id
                print(f"Counter: '{username}' -> ID: {counter_id}")
                
            print(f"Total existing counters: {len(self.counter_mappings)}")
                
        except Exception as e:
            print(f"Error connecting to database: {e}")
    
    def read_excel_data(self):
        """Read Excel data"""
        try:
            df = pd.read_excel(self.excel_file_path)
            print(f"Excel columns: {df.columns.tolist()}")
            print(f"Total rows in Excel: {len(df)}")
            return df
        except Exception as e:
            print(f"Error reading Excel file: {e}")
            return None
    
    def clean_column_names(self, df):
        """Clean column names"""
        df.columns = df.columns.str.strip().str.lower().str.replace(' ', '_')
        return df
    
    def discover_tickets_and_counters(self, df):
        """Dynamically discover all unique show names and NEW counters from Excel"""
        # Discover all unique show names for tickets
        if 'show_name' in df.columns:
            unique_shows = df['show_name'].dropna().unique()
            print(f"Found {len(unique_shows)} unique show names in Excel:")
            
            for show_name in unique_shows:
                clean_show = str(show_name).strip()
                if clean_show and clean_show not in self.ticket_mappings:
                    self.ticket_mappings[clean_show] = self.next_ticket_id
                    print(f"  Ticket: '{clean_show}' -> ID: {self.next_ticket_id}")
                    self.next_ticket_id += 1
        
        # Discover only NEW unique counters (that don't exist in database)
        if 'counter' in df.columns:
            unique_counters = df['counter'].dropna().unique()
            new_counters = []
            
            for counter_name in unique_counters:
                clean_counter = str(counter_name).strip().lower()
                if clean_counter and clean_counter not in self.counter_mappings:
                    new_counters.append(counter_name)
                    self.counter_mappings[clean_counter] = self.next_counter_id
                    print(f"  NEW Counter: '{counter_name}' -> ID: {self.next_counter_id}")
                    self.next_counter_id += 1
            
            print(f"Found {len(new_counters)} NEW counters in Excel")
    
    def clean_invoice_number(self, invoice_no):
        """Clean invoice number - remove 'Inv-' prefix and remove leading zeros"""
        if pd.isna(invoice_no):
            return None
            
        invoice_str = str(invoice_no).strip()
        
        # Remove "Inv-" prefix if present
        if invoice_str.lower().startswith('inv-'):
            invoice_str = invoice_str[4:]
        
        # Extract only numbers and remove leading zeros
        numbers = ''.join(filter(str.isdigit, invoice_str))
        
        # Remove leading zeros
        numbers = numbers.lstrip('0')
        
        return numbers if numbers else None
    
    def clean_currency_value(self, value):
        """Clean currency values like '₹ 240.00' to float"""
        if pd.isna(value):
            return 0.0
            
        value_str = str(value).strip()
        
        # Remove currency symbols, commas, and spaces
        value_str = value_str.replace('₹', '').replace(',', '').replace(' ', '').strip()
        
        try:
            return float(value_str)
        except:
            return 0.0
    
    def safe_date_conversion(self, date_value):
        """Safely convert date values to datetime"""
        if pd.isna(date_value):
            return datetime.now()
        
        try:
            if isinstance(date_value, datetime):
                return date_value
            elif isinstance(date_value, str):
                for fmt in ['%Y-%m-%d', '%d-%m-%Y', '%m/%d/%Y', '%Y/%m/%d']:
                    try:
                        return datetime.strptime(date_value, fmt)
                    except:
                        continue
                return datetime.now()
            else:
                return date_value.to_pydatetime() if hasattr(date_value, 'to_pydatetime') else datetime.now()
        except:
            return datetime.now()
    
    def process_excel_data(self, df):
        """Process Excel data and convert to SQL transactions using ONLY Excel values"""
        transactions = []
        
        for index, row in df.iterrows():
            try:
                # Extract EXACT values from Excel row
                serial = row['s.no'] if 's.no' in df.columns and pd.notna(row['s.no']) else (index + 1)
                invoice_no = row['invoice_no'] if 'invoice_no' in df.columns and pd.notna(row['invoice_no']) else None
                date = row['date'] if 'date' in df.columns and pd.notna(row['date']) else datetime.now()
                show_name = row['show_name'] if 'show_name' in df.columns and pd.notna(row['show_name']) else 'wax museum'
                category = row['category'] if 'category' in df.columns and pd.notna(row['category']) else 'Adult'
                counter_name = row['counter'] if 'counter' in df.columns and pd.notna(row['counter']) else 'madhu'
                adult_count = row['adult'] if 'adult' in df.columns and pd.notna(row['adult']) else 0
                child_count = row['child'] if 'child' in df.columns and pd.notna(row['child']) else 0
                total_paid = row['total_paid'] if 'total_paid' in df.columns and pd.notna(row['total_paid']) else 0
                
                # Clean and convert values
                invoice_no = self.clean_invoice_number(invoice_no)
                date = self.safe_date_conversion(date)
                show_name = str(show_name).strip() if pd.notna(show_name) else 'wax museum'
                category = str(category).strip() if pd.notna(category) else 'Adult'
                counter_name = str(counter_name).strip().lower() if pd.notna(counter_name) else 'madhu'
                adult_count = int(adult_count) if pd.notna(adult_count) else 0
                child_count = int(child_count) if pd.notna(child_count) else 0
                total_paid = self.clean_currency_value(total_paid)
                
                # Skip row if essential data is missing
                if not all([invoice_no, date, show_name, category, counter_name, adult_count is not None]):
                    print(f"⚠️  Skipping row {index + 1} due to missing essential data")
                    continue
                
                # Get mappings - FORCE madhu counter to be created
                ticket_id = self.ticket_mappings.get(show_name, 1)
                
                # Handle counter mapping - create madhu counter if needed
                if counter_name == 'madhu' and 'madhu' not in self.counter_mappings:
                    # Add madhu to counter mappings with next available ID
                    self.counter_mappings['madhu'] = self.next_counter_id
                    self.next_counter_id += 1
                    print(f"  Added MADHU Counter: 'madhu' -> ID: {self.counter_mappings['madhu']}")
                
                counter_id = self.counter_mappings.get(counter_name, 1)
                
                # Ensure adult_count is at least 1
                if adult_count == 0 and child_count > 0:
                    adult_count = 1
                elif adult_count == 0:
                    adult_count = 1
                
                transaction = {
                    'invoice_no': invoice_no,
                    'date': date,
                    'adult_count': adult_count,
                    'child_count': child_count,
                    'category': category,
                    'total_paid': total_paid,
                    'ticket_id': ticket_id,
                    'counter_id': counter_id,
                    'createdAt': datetime.now(),
                    'updatedAt': datetime.now()
                }
                
                transactions.append(transaction)
                
                if (index + 1) % 100 == 0:
                    print(f"Processed {index + 1} rows...")
                
            except Exception as e:
                print(f"Error processing row {index}: {e}")
                continue
        
        return transactions
    
    def generate_sql_files(self, transactions, output_dir='sql_output'):
        """Generate SQL insert statements for tickets, counters, and transactions"""
        
        # Create output directory
        os.makedirs(output_dir, exist_ok=True)
        
        # 1. Generate TICKETS SQL
        tickets_sql = """-- Auto-generated TICKETS insert statements from Excel data
-- Generated on: {timestamp}
-- Total tickets: {count}

INSERT INTO tickets (id, price, dropdown_name, show_name, counter_id, is_analytics, deleted, "createdAt", "updatedAt") VALUES
""".format(timestamp=datetime.now(), count=len(self.ticket_mappings))

        ticket_values = []
        for show_name, ticket_id in self.ticket_mappings.items():
            # Set default price based on show name
            if 'combo' in show_name.lower() and 'wax' in show_name.lower():
                price = 80  # Combo + Wax Museum
            elif 'combo' in show_name.lower():
                price = 100  # Combo only
            elif 'horror' in show_name.lower():
                price = 60   # Horror House
            else:
                price = 60   # Wax Museum default
            
            value = f"({ticket_id}, {price}, 'Standard', '{show_name}', NULL, false, false, '{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}', '{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}')"
            ticket_values.append(value)
        
        tickets_sql += ',\n'.join(ticket_values) + ';'
        
        # Write tickets SQL
        tickets_file = os.path.join(output_dir, 'tickets_insert.sql')
        with open(tickets_file, 'w') as f:
            f.write(tickets_sql)
        
        # 2. Generate ONLY NEW COUNTERS SQL (including madhu)
        # Find which counters are new (ID >= 14)
        new_counters = {}
        for counter_name, counter_id in self.counter_mappings.items():
            if counter_id >= 14:  # Only counters we're creating
                new_counters[counter_name] = counter_id
        
        if new_counters:
            counters_sql = """-- Auto-generated NEW COUNTERS insert statements from Excel data
-- Generated on: {timestamp}
-- Total NEW counters: {count}

INSERT INTO counters (id, username, password, role, special, "createdAt", "updatedAt") VALUES
""".format(timestamp=datetime.now(), count=len(new_counters))

            counter_values = []
            for counter_name, counter_id in new_counters.items():
                # Default password hash and role
                password_hash = "$2a$10$jp2/25nQ/ARPoiWt6N2m7e.vpNA7N.J2UDbQ0Mv57vm44jPVNT25S"
                role = "user"
                special = "false"
                
                value = f"({counter_id}, '{counter_name}', '{password_hash}', '{role}', {special}, '{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}', '{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}')"
                counter_values.append(value)
            
            counters_sql += ',\n'.join(counter_values) + ';'
            
            # Write counters SQL
            counters_file = os.path.join(output_dir, 'counters_insert.sql')
            with open(counters_file, 'w') as f:
                f.write(counters_sql)
        else:
            # Create empty counters file if no new counters
            counters_file = os.path.join(output_dir, 'counters_insert.sql')
            with open(counters_file, 'w') as f:
                f.write("-- No new counters to insert (all counters already exist in database)")
        
        # 3. Generate TRANSACTIONS SQL
        transactions_sql = """-- Auto-generated TRANSACTIONS insert statements from Excel data
-- Generated on: {timestamp}
-- Total transactions: {count}

INSERT INTO transactions (invoice_no, date, adult_count, child_count, category, total_paid, ticket_id, counter_id, "createdAt", "updatedAt") VALUES
""".format(timestamp=datetime.now(), count=len(transactions))

        transaction_values = []
        for transaction in transactions:
            value = f"('{transaction['invoice_no']}', '{transaction['date'].strftime('%Y-%m-%d %H:%M:%S')}', {transaction['adult_count']}, {transaction['child_count']}, '{transaction['category']}', {transaction['total_paid']}, {transaction['ticket_id']}, {transaction['counter_id']}, '{transaction['createdAt'].strftime('%Y-%m-%d %H:%M:%S')}', '{transaction['updatedAt'].strftime('%Y-%m-%d %H:%M:%S')}')"
            transaction_values.append(value)
        
        transactions_sql += ',\n'.join(transaction_values) + ';'
        
        # Write transactions SQL
        transactions_file = os.path.join(output_dir, 'transactions_insert.sql')
        with open(transactions_file, 'w') as f:
            f.write(transactions_sql)
        
        print(f"\n✅ SQL files generated in '{output_dir}' folder:")
        print(f"   📄 {tickets_file} - {len(self.ticket_mappings)} tickets")
        print(f"   📄 {counters_file} - {len(new_counters)} NEW counters")
        print(f"   📄 {transactions_file} - {len(transactions)} transactions")
        
        # Show sample data
        print(f"\n📊 Sample data:")
        if transactions:
            sample = transactions[0]
            print(f"   Invoice: {sample['invoice_no']} (without 'Inv-' prefix and leading zeros)")
            print(f"   Counter ID: {sample['counter_id']} (Madhu counter)")
            print(f"   Adults: {sample['adult_count']}, Total: ₹{sample['total_paid']}")
        
        # Show execution order
        print(f"\n🚀 EXECUTION ORDER:")
        print(f"   1. psql -h localhost -U santhoshh -d wax_museum_done -f {tickets_file}")
        if new_counters:
            print(f"   2. psql -h localhost -U santhoshh -d wax_museum_done -f {counters_file}")
        print(f"   3. psql -h localhost -U santhoshh -d wax_museum_done -f {transactions_file}")
    
    def migrate(self, output_dir='sql_output'):
        """Main migration function"""
        print("🚀 Starting Excel to SQL migration...")
        
        # First get existing counters from database
        self.get_existing_counters()
        
        df = self.read_excel_data()
        if df is None:
            print("❌ Failed to read Excel file")
            return
        
        df = self.clean_column_names(df)
        print(f"✅ Cleaned columns: {df.columns.tolist()}")
        
        # Discover all tickets and NEW counters from Excel
        self.discover_tickets_and_counters(df)
        
        if not self.ticket_mappings:
            print("❌ No tickets found in Excel")
            return
        
        transactions = self.process_excel_data(df)
        
        if not transactions:
            print("❌ No transactions processed")
            return
        
        self.generate_sql_files(transactions, output_dir)

def main():
    EXCEL_FILE_PATH = '/home/twlight/Music/apr to sep f.xlsx'
    OUTPUT_DIR = 'sql_output'
    DB_CONNECTION_STRING = "postgresql://santhoshh:blackarch@localhost:5432/wax_museum_done"
    
    if not os.path.exists(EXCEL_FILE_PATH):
        print(f"❌ Error: Excel file not found at {EXCEL_FILE_PATH}")
        return
    
    migrator = ExcelToSQLMigrator(EXCEL_FILE_PATH, DB_CONNECTION_STRING)
    migrator.migrate(OUTPUT_DIR)

if __name__ == "__main__":
    main()