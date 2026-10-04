"""Build data/demo/adult.csv (held-out split) and models/demo_model.joblib."""
import sys, numpy as np, pandas as pd, joblib
from pathlib import Path
from sklearn.compose import ColumnTransformer
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler

ROOT = Path(__file__).resolve().parents[1]
COLS = ["age","workclass","education","marital_status","occupation","race","sex",
        "capital_gain","capital_loss","hours_per_week"]

def load_adult():
    try:
        from sklearn.datasets import fetch_openml
        df = fetch_openml("adult", version=2, as_frame=True).frame
        df.columns = [c.replace("-", "_") for c in df.columns]
        df["income"] = df["class"].astype(str).str.strip()
        df = df[COLS + ["income"]].dropna()
        for c in df.select_dtypes("category"): df[c] = df[c].astype(str)
        return df
    except Exception as e:
        print("Adult download failed (%s); using synthetic stand-in." % e, file=sys.stderr)
        rng = np.random.default_rng(0); n = 6000
        sex = rng.choice(["Male","Female"], n, p=[.67,.33])
        age = rng.integers(18, 70, n); hrs = rng.integers(20, 60, n)
        edu = rng.choice(["Bachelors","HS-grad","Masters","Some-college"], n)
        z = .04*(age-38)+.05*(hrs-40)+(edu=="Bachelors")*.8+(edu=="Masters")*1.4+(sex=="Male")*.9-1.6
        y = rng.random(n) < 1/(1+np.exp(-z))
        return pd.DataFrame({"age":age,"workclass":"Private","education":edu,"marital_status":"Married",
            "occupation":rng.choice(["Sales","Tech","Craft","Admin"], n),"race":"White","sex":sex,
            "capital_gain":rng.choice([0,0,0,5000], n),"capital_loss":0,"hours_per_week":hrs,
            "income":np.where(y, ">50K", "<=50K")})

df = load_adult()
train, test = train_test_split(df, test_size=0.3, random_state=42, stratify=df["income"])
X, y = train.drop(columns="income"), train["income"]
num = X.select_dtypes("number").columns.tolist(); cat = [c for c in X.columns if c not in num]
pipe = Pipeline([
    ("prep", ColumnTransformer([("num", StandardScaler(), num),
                                ("cat", OneHotEncoder(handle_unknown="ignore"), cat)])),
    ("clf", LogisticRegression(max_iter=1000)),
]).fit(X, y)
(ROOT/"data/demo").mkdir(parents=True, exist_ok=True); (ROOT/"models").mkdir(exist_ok=True)
test.to_csv(ROOT/"data/demo/adult.csv", index=False)
joblib.dump(pipe, ROOT/"models/demo_model.joblib")
print("Saved demo data (%d rows) and model. Accuracy: %.3f" % (len(test), pipe.score(test.drop(columns="income"), test["income"])))
