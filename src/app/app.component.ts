import { firestore } from 'firebase/app';
import { Observable } from 'rxjs';
import { Component } from '@angular/core';
import { AngularFirestore } from '@angular/fire/firestore';

// FireStore側で作成したToDoのInterfaceを定義
interface ToDoItem {
  id: string;
  body: string;
  isCompleted: boolean;
  created_at: {
    seconds: number,
    nanoseconds: number,
    toDate(): Date
  };
}

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'my-todo-app';
  inputName = '';
  items: Observable<ToDoItem[]>;

  // valueChangesにidFieldを指定するとidが取得できるようになる
  constructor(private db: AngularFirestore) {
    this.items = db.collection<ToDoItem>('tasks', ref => {
      return ref.orderBy('created_at', 'desc');
    }).valueChanges({ idField: 'id' });
  }

  // テキスト入力欄に入力された名前でToDoを作る
  clickAddTodo(text: string) {
    if (!text) { return; }
    console.log(text);
    this.inputName = '';
    const item = {
      body: text,
      isCompleted: false,
      created_at: firestore.FieldValue.serverTimestamp()
    };
    this.db.collection('tasks').add(item);
  }

  // ToDoをクリックしたら完了/未完了を切り替える
  clickItem(item: ToDoItem) {
    const doc = this.db.doc<ToDoItem>('tasks/' + item.id);
    if (!doc) { return; }
    doc.update({ isCompleted: !item.isCompleted });
  }

  // ToDoの削除処理
  clickDeleteItem(item: ToDoItem) {
    const doc = this.db.doc<ToDoItem>('tasks/' + item.id);
    if (!doc) { return; }
    doc.delete();
  }
}
