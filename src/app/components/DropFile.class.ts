import {fromEvent, map, mergeMap} from 'rxjs';

export class DropFileClass {
  constructor(input: HTMLTextAreaElement, output: HTMLTextAreaElement) {
    DropFileClass._setupDropArea(input, output);
  }

  private static _setupDropArea(inputTextarea: HTMLTextAreaElement, outputTextarea: HTMLTextAreaElement): void {
    fromEvent(inputTextarea, 'dragenter')
      .pipe(
        map(
          (event: Event) => {
            event.stopPropagation();
            event.preventDefault();
          }
        )
      )
      .subscribe(
        () => {
          inputTextarea.value = '';
          outputTextarea.value = '';
        }
      );

    fromEvent(inputTextarea, 'drop')
      .pipe(
        map(
          (event: Event) => {
            event.stopPropagation();
            event.preventDefault();
            return <DragEvent>event;
          }
        )
      )
      .pipe(
        mergeMap(DropFileClass._readDroppedFile)
      )
      .subscribe(
        {
          next: (value: string) => {
            inputTextarea.value = value;
          },
          error: (error: string) => {
            inputTextarea.value = 'Error! ' + error;
          }
        }
      );
  }

  private static _readDroppedFile(event: DragEvent): Promise<string> {
    return new Promise((resolve, reject) => {
      const dt = event.dataTransfer;

      if (dt === null) {
        reject('Data transfer is null');
        return;
      }

      const file = dt.files[0];

      // Check for the correct file type
      if (file.type && file.type !== ('image/svg+xml')) {
        reject('File is not an SVG image');
        return;
      }

      const fileReader = new FileReader();
      fileReader.readAsArrayBuffer(file);

      fileReader.onload = (ev: ProgressEvent): void => {
        let binary = '';
        const bytes = new Uint8Array((<any>ev.target).result); // eslint-disable-line @typescript-eslint/no-explicit-any
        for (let i = 0; i < bytes.byteLength; i++) {
          binary += String.fromCharCode(bytes[i]);
        }

        resolve(binary);
      };

      fileReader.onerror = (error: ProgressEvent): void => {
        console.error('FileReader', error);
        reject('FileReader experienced an error');
      };
    });
  }
}
