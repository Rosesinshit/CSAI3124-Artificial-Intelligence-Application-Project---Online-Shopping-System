from __future__ import annotations

import os
from functools import lru_cache
from typing import List

import torch
from fastapi import FastAPI
from pydantic import BaseModel, Field
from sentence_transformers import SentenceTransformer


MODEL_NAME = os.getenv("SEMANTIC_EMBEDDING_MODEL", "sentence-transformers/all-MiniLM-L6-v2")
DEVICE = "cuda" if torch.cuda.is_available() else "cpu"


class EmbedRequest(BaseModel):
    texts: List[str] = Field(default_factory=list)
    normalize: bool = True
    model: str | None = None


class EmbedResponse(BaseModel):
    model: str
    device: str
    dimensions: int
    embeddings: List[List[float]]


@lru_cache(maxsize=1)
def get_model() -> SentenceTransformer:
    model_name = MODEL_NAME
    model = SentenceTransformer(model_name, device=DEVICE)
    return model


app = FastAPI(title="ShopOnline Semantic NLP Service", version="1.0.0")


@app.get("/health")
def health() -> dict:
    model = get_model()
    embedding_dimension = model.get_sentence_embedding_dimension()
    return {
        "status": "ok",
        "model": MODEL_NAME,
        "device": DEVICE,
        "dimensions": embedding_dimension,
        "cuda_available": torch.cuda.is_available(),
    }


@app.post("/embed", response_model=EmbedResponse)
def embed(request: EmbedRequest) -> EmbedResponse:
    model = get_model()
    texts = [text.strip() for text in request.texts if text and text.strip()]

    if not texts:
        return EmbedResponse(
            model=MODEL_NAME,
            device=DEVICE,
            dimensions=model.get_sentence_embedding_dimension(),
            embeddings=[],
        )

    embeddings = model.encode(
        texts,
        normalize_embeddings=request.normalize,
        convert_to_numpy=True,
        batch_size=16,
        show_progress_bar=False,
    )

    return EmbedResponse(
        model=MODEL_NAME,
        device=DEVICE,
        dimensions=int(embeddings.shape[1]),
        embeddings=embeddings.tolist(),
    )