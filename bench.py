import time
import sqlite3
import random
import string

# Configurações do benchmark
NUM_USERS = 100_000
NUM_JOBS_PER_USER = 3
NUM_SEARCHES = 1000

# Gerador de nomes aleatórios
def random_name():
    return ''.join(random.choices(string.ascii_lowercase, k=8))

# Geração de dados
print("Gerando dados...")
users = [{'id': i, 'name': random_name()} for i in range(NUM_USERS)]
jobs = []
for user in users:
    for _ in range(NUM_JOBS_PER_USER):
        jobs.append({
            'user_id': user['id'],
            'job': random.choice(['Admin', 'Support', 'Sales', 'Dev', 'Manager'])
        })

# --------------------------
# Benchmark: Python puro
# --------------------------
print("Executando benchmark em Python puro...")
start_time = time.time()

for _ in range(NUM_SEARCHES):
    user = random.choice(users)
    user_jobs = [j for j in jobs if j['user_id'] == user['id']]

python_time = time.time() - start_time
print(f"Tempo (Python puro): {python_time:.4f} segundos")

# --------------------------
# Benchmark: SQLite
# --------------------------
print("Executando benchmark com SQLite em memória...")
conn = sqlite3.connect(':memory:')
cur = conn.cursor()

cur.execute("CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT)")
cur.execute("CREATE TABLE jobs (user_id INTEGER, job TEXT)")

cur.executemany("INSERT INTO users (id, name) VALUES (?, ?)", [(u['id'], u['name']) for u in users])
cur.executemany("INSERT INTO jobs (user_id, job) VALUES (?, ?)", [(j['user_id'], j['job']) for j in jobs])
conn.commit()

cur.execute("CREATE INDEX idx_user_id ON jobs(user_id)")
conn.commit()

start_time = time.time()

for _ in range(NUM_SEARCHES):
    user_id = random.choice(users)['id']
    cur.execute("SELECT job FROM jobs WHERE user_id = ?", (user_id,))
    _ = cur.fetchall()

sql_time = time.time() - start_time
print(f"Tempo (SQLite): {sql_time:.4f} segundos")

conn.close()