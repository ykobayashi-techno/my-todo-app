import { Observable } from 'rxjs';
import { Component } from '@angular/core';
import { AngularFirestore } from '@angular/fire/firestore';
import { AngularFireAuth } from '@angular/fire/auth';
import { auth } from 'firebase/app';
import { firestore, FirebaseError } from 'firebase/app';

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
  isProcessLogin = true;
  isPermitted = false;
  title = 'my-todo-app';
  inputName = '';
  items: Observable<ToDoItem[]>;

  constructor(private db: AngularFirestore, public afAuth: AngularFireAuth) {
    // メールをチェックして、リストをロード
    this.afAuth.authState.subscribe(value => {
      this.isProcessLogin = false;
      if (value && value.email && /\@tecowl.co.jp$/.test(value.email)) {
        console.log('load ToDoList');
        this.isPermitted = true;
        this.loadToDoList(db);
      } else if (value && value.email) {
        this.isPermitted = false;
        console.log('not permission');
      } else {
        this.isPermitted = false;
        console.log('info logout');
      }
    });
  }

  // ログイン処理。これでGoogleのログインページに遷移して、ログインすると元のページに戻る
  login() {
    // this.afAuth.auth.signInWithPopup(new firebase.auth.GoogleAuthProvider());
    this.isProcessLogin = true;
    this.afAuth.auth.signInWithRedirect(new auth.GoogleAuthProvider());
  }

  // ログアウト処理
  logout() {
    this.isProcessLogin = true;
    this.afAuth.auth.signOut();
  }

  // valueChangesにidFieldを指定するとidが取得できるようになる
  loadToDoList(db: AngularFirestore) {
    this.items = db.collection<ToDoItem>('tasks', ref => {
      return ref.orderBy('created_at', 'desc');
    }).valueChanges({ idField: 'id' });

    this.items.subscribe(
      value => value,
      error => {
        console.log(error);
      }
    );
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
