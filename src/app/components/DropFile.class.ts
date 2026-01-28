import { fromEvent, map, mergeMap } from 'rxjs';

function setupDropArea(inputTextarea: HTMLTextAreaElement, outputTextarea: HTMLTextAreaElement): void {
  inputTextarea.addEventListener('dragover', (event) => {
    event.preventDefault();
  })

  inputTextarea.addEventListener('dragenter', (event) => {
    event.preventDefault();
    inputTextarea.value = '';
    outputTextarea.value = '';
  })

  fromEvent(inputTextarea, 'drop')
    .pipe(
      map(
        (event: Event) => {
          // console.log(event)
          event.stopPropagation();
          event.preventDefault();
          return <DragEvent>event;
        }
      ),
      mergeMap(readDroppedFile)
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
    )
}

function readDroppedFile(event: DragEvent): Promise<string> {
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

export function createDropAreas(input: HTMLTextAreaElement, output: HTMLTextAreaElement): void {
  setupDropArea(input, output)
}
