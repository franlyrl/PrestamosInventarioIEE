import pandas as pd
df = pd.read_excel('Activos.xlsx', header=1)
print('Total rows:', len(df))
print('Missing Placa:', df['Placa'].isna().sum())
dups = df.duplicated(subset=['Placa'], keep=False)
print('Duplicate Placa count:', dups.sum())
print('Duplicates:')
for p in df[dups]['Placa'].unique():
    print(p)
