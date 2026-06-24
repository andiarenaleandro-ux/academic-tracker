from sqlalchemy.orm import Session


def get_all(db: Session, model, **filters):
    q = db.query(model)
    for attr, value in filters.items():
        if value is not None:
            q = q.filter(getattr(model, attr) == value)
    return q.all()


def get_by_id(db: Session, model, id: int):
    return db.query(model).filter(model.id == id).first()


def create(db: Session, model, data: dict):
    obj = model(**data)
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj


def update(db: Session, db_obj, data: dict):
    for key, value in data.items():
        if value is not None:
            setattr(db_obj, key, value)
    db.commit()
    db.refresh(db_obj)
    return db_obj


def delete(db: Session, db_obj):
    db.delete(db_obj)
    db.commit()
