use image::{ImageFormat, GenericImageView};
use std::path::{Path, PathBuf};
use std::fs;
use uuid::Uuid;
use std::io::BufWriter;

pub async fn convert_image(input_path: &Path, target_format: &str) -> Result<String, String> {
    let img = image::open(input_path).map_err(|e| format!("Failed to open image: {}", e))?;

    let format = match target_format.to_lowercase().as_str() {
        "png" => ImageFormat::Png,
        "jpg" | "jpeg" => ImageFormat::Jpeg,
        "webp" => ImageFormat::WebP,
        "ico" => ImageFormat::Ico,
        "tiff" | "tif" => ImageFormat::Tiff,
        "bmp" => ImageFormat::Bmp,
        "gif" => ImageFormat::Gif,
        _ => return Err(format!("Unsupported image format: {}", target_format)),
    };

    let output_dir = std::env::temp_dir().join("openconvert").join("output");
    fs::create_dir_all(&output_dir).map_err(|e| e.to_string())?;

    let output_name = format!(
        "{}.{}",
        Uuid::new_v4().simple(),
        target_format.to_lowercase()
    );
    let output_path = output_dir.join(&output_name);

    let mut output_file = fs::File::create(&output_path).map_err(|e| e.to_string())?;

    img.write_to(&mut output_file, format)
        .map_err(|e| format!("Failed to write image: {}", e))?;

    Ok(output_path.to_string_lossy().to_string())
}

// images_to_pdf - disabled due to printpdf API compatibility issues
// pub async fn images_to_pdf(image_paths: &[PathBuf], output_path: &Path) -> Result<(), String> {
//     use printpdf::*;
//
//     let (doc, page1, layer1) = PdfDocument::new("Converted", Mm(210.0), Mm(297.0), "Layer 1");
//
//     for (i, img_path) in image_paths.iter().enumerate() {
//         if i == 0 {
//             let layer = doc.get_page(page1).get_layer(layer1);
//             let img = image::open(img_path).map_err(|e| e.to_string())?;
//             let (width, height) = (img.width() as f64, img.height() as f64);
//             let aspect = width / height;
//
//             let (pdf_width, pdf_height) = if aspect > 1.0 {
//                 (Mm(190.0), Mm(190.0 / aspect))
//             } else {
//                 (Mm(190.0 * aspect), Mm(190.0))
//             };
//
//             let image_x = Mm((210.0 - pdf_width.0) / 2.0);
//             let image_y = Mm((297.0 - pdf_height.0) / 2.0);
//
//             let pdf_image = Image::from_dynamic_image(&img);
//             let transform = ImageTransform {
//                 translate_x: Some(image_x),
//                 translate_y: Some(image_y),
//                 scale_x: Some(pdf_width / Mm(width)),
//                 scale_y: Some(pdf_height / Mm(height)),
//                 rotate: None,
//                 rotate_origin: None,
//                 dpi: None,
//             };
//             layer.add_image(pdf_image, transform);
//         } else {
//             let (page, layer_idx) = doc.add_page(Mm(210.0), Mm(297.0), "Layer");
//             let layer = doc.get_page(page).get_layer(layer_idx);
//
//             let img = image::open(img_path).map_err(|e| e.to_string())?;
//             let (width, height) = (img.width() as f64, img.height() as f64);
//             let aspect = width / height;
//
//             let (pdf_width, pdf_height) = if aspect > 1.0 {
//                 (Mm(190.0), Mm(190.0 / aspect))
//             } else {
//                 (Mm(190.0 * aspect), Mm(190.0))
//             };
//
//             let image_x = Mm((210.0 - pdf_width.0) / 2.0);
//             let image_y = Mm((297.0 - pdf_height.0) / 2.0);
//
//             let pdf_image = Image::from_dynamic_image(&img);
//             let transform = ImageTransform {
//                 translate_x: Some(image_x),
//                 translate_y: Some(image_y),
//                 scale_x: Some(pdf_width / Mm(width)),
//                 scale_y: Some(pdf_height / Mm(height)),
//                 rotate: None,
//                 rotate_origin: None,
//                 dpi: None,
//             };
//             layer.add_image(pdf_image, transform);
//         }
//     }
//
//     let file = fs::File::create(output_path).map_err(|e| e.to_string())?;
//     let mut buf_writer = BufWriter::new(file);
//     doc.save(&mut buf_writer).map_err(|e| e.to_string())?;
//
//     Ok(())
// }