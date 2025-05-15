import { Component } from '@angular/core';
import { StatTableComponent } from "../stat-table/stat-table.component";
import { BackendCallsService } from '../backend-calls.service';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { WinRateComponent } from "../win-rate/win-rate.component";

interface UploadedFile{
  id: number,
  filename: string,
  originalname: string,
  filepath: string;
  created_at: string;
}

@Component({
  selector: 'app-file-uploader',
  standalone: true,
  imports: [StatTableComponent, WinRateComponent],
  templateUrl: './file-uploader.component.html',
  styleUrl: './file-uploader.component.scss'
})
export class FileUploaderComponent {

  selectedFiles:File[] = [];
  //uploadedFiles:UploadedFile[] = [];
  constructor(private backend: BackendCallsService) {}


  ngOnInit(): void {
    
  }

  /*loadUploadedFiles(){
    this.http.get<UploadedFile[]>('http://localhost:3000/api/uploads')
    .subscribe({
      next: (files)=>{
        this.uploadedFiles = files;
      },
      error: (error)=>{
        console.error('Error loading files', error);
      }
    });
  }*/

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    // Filter for .slp files only
    const slpFiles = Array.from(input.files).filter(file =>
      file.name.endsWith('.slp')
    );

    if (slpFiles.length === 0) {
      console.warn('No .slp files selected.');
      return;
    }

    const formData = new FormData();
    slpFiles.forEach(file => formData.append('files', file));

    this.backend.myUploadFiles(formData);
    
  }
}
